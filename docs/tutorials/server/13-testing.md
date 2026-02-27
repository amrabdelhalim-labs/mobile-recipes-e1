# الدرس الثالث عشر: اختبار الخادم — E2E والمستودعات 🧪

> **هدف الدرس:** فهم كيف تُكتب اختبارات خادم وصفاتي وما الذي تتحقق منه

---

## 1. نظرة عامة على ملفات الاختبار

يحتوي خادم المشروع على أربعة ملفات اختبار في `server/tests/`:

| الملف | النوع | ما يختبر |
|-------|-------|-------|
| `api.test.js` | E2E عبر HTTP | طلبات REST الفعلية من البداية للنهاية |
| `repositories.test.js` | وحدة (Unit) | طبقة Repository مع قاعدة البيانات |
| `comprehensive.test.js` | تكامل (Integration) | سيناريو كامل متعدد المراحل |
| `storage.test.js` | وحدة + تكامل | طبقة التخزين بدون شبكة في 4 مراحل |

---

## 2. كيفية تشغيل الاختبارات

```bash
# من مجلد server/
node tests/api.test.js            # اختبارات E2E فقط
node tests/repositories.test.js   # اختبارات المستودعات فقط
node tests/comprehensive.test.js  # الاختبار الشامل فقط
node tests/storage.test.js        # طبقة التخزين فقط (بدون شبكة)
npm run test:all                  # جميع الملفات
```

> **مهم:** تأكد من أن قاعدة بيانات PostgreSQL تعمل وأن `.env` يحتوي على بيانات الاتصال الصحيحة. الاختبارات تُنشئ بيانات تجريبية وتحذفها في النهاية.

> **ملاحظة:** `storage.test.js` لا يحتاج لقاعدة بيانات أو شبكة — يعمل بشكل مستقل تماماً.

---

## 3. ملف `api.test.js` — اختبار E2E لـ REST API

### ما هو الاختبار E2E؟

E2E = End-to-End = اختبار من البداية للنهاية.

```
الاختبار يُشغّل خادم Express فعلياً
        ↓
يُرسل طلبات HTTP حقيقية للـ REST endpoints
        ↓
يتحقق من رموز الاستجابة والبيانات
        ↓
يوقف الخادم ويُغلق الاتصال بقاعدة البيانات
```

### دالة `makeRequest` المساعدة

```javascript
async function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers, // headers إضافية مثل Authorization
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: JSON.parse(data),
        });
      });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
```

**لماذا دالة مساعدة؟**

بدلاً من تكرار كود HTTP في كل اختبار، نكتب `makeRequest()` مرة واحدة ونستخدمها لكل الطلبات.

### المراحل الخمس لـ `api.test.js`

**Phase 1: AUTHENTICATION — اختبار التسجيل**

```javascript
// التسجيل يجب أن يُرجع 201
const registerRes = await makeRequest('POST', '/account/register', {
  name: 'مستخدم تجريبي',
  email: 'test@example.com',
  password: 'Test123!',
});
assertTrue(registerRes.statusCode === 201, 'Registration returns 201');
assertTrue(!!registerRes.body?.message, 'Registration returns message');
```

**Phase 2: LOGIN — اختبار تسجيل الدخول**

```javascript
// تسجيل الدخول يُرجع 200 وـ token
const loginRes = await makeRequest('POST', '/account/login', {
  email: 'test@example.com',
  password: 'Test123!',
});
assertTrue(loginRes.statusCode === 200, 'Login returns 200');
assertTrue(!!loginRes.body?.token, 'Login returns token');
authToken = loginRes.body?.token;
```

**Phase 3: POSTS MANAGEMENT — اختبار المنشورات**

```javascript
// بدون مصادقة → 401
const noAuthRes = await makeRequest('POST', '/posts/create', {
  title: 'وصفة',
  content: 'محتوى',
});
assertTrue(noAuthRes.statusCode === 401, 'No auth returns 401');

// مع مصادقة → 200
const postsRes = await makeRequest('GET', '/posts', null, {
  Authorization: `Bearer ${authToken}`,
});
assertTrue(postsRes.statusCode === 200, 'Get posts returns 200');
assertTrue(Array.isArray(postsRes.body?.posts), 'Response has posts array');
```

**Phase 4: ERROR HANDLING — اختبار معالجة الأخطاء**

```javascript
// مسار غير موجود → 404
const invalidRes = await makeRequest('GET', '/invalid-route');
assertTrue(invalidRes.statusCode === 404, 'Invalid route returns 404');

// بيانات ناقصة → رمز خطأ (ليس 200)
const invalidBodyRes = await makeRequest('POST', '/account/register', {
  // حقول مفقودة
});
assertTrue(invalidBodyRes.statusCode !== 200, 'Invalid body caught');
```

**Phase 5: RESPONSE STRUCTURE — التحقق من هيكل الاستجابة**

```javascript
// التحقق من وجود الحقول المطلوبة
const res = await makeRequest('GET', '/posts', null, {
  Authorization: `Bearer ${authToken}`,
});
assertTrue(res.body?.posts !== undefined, 'Response has posts field');
assertTrue(
  res.headers['content-type']?.includes('application/json'),
  'Content-Type is JSON'
);
```

---

## 4. ملف `repositories.test.js` — اختبار المستودعات

### الهدف

اختبار طبقة Repository مباشرة مع Sequelize + PostgreSQL — بدون تشغيل خادم HTTP.

### اختبار UserRepository

```javascript
// إنشاء مستخدم
const user = await repositories.user.create({
  name: 'أحمد',
  email: 'ahmed@test.com',
  password: 'hashed_password',
  ImageUrl: 'https://example.com/image.jpg',
});
assert(user.id, 'المستخدم أُنشئ');
assert(user.name === 'أحمد', 'الاسم صحيح');

// البحث بالبريد الإلكتروني
const found = await repositories.user.findByEmail('ahmed@test.com');
assert(found !== null, 'تم إيجاد المستخدم بالبريد');
assert(found.id === user.id, 'المعرّف صحيح');

// التحديث
await repositories.user.update(user.id, { name: 'أحمد المحدث' });
const updated = await repositories.user.findByPk(user.id);
assert(updated.name === 'أحمد المحدث', 'الاسم تم تحديثه');
```

### اختبار PostRepository (الوصفات)

```javascript
// إنشاء وصفة (منشور)
const post = await repositories.post.create({
  title: 'طريقة المكرونة السريعة',
  content: 'مكرونة لذيذة وسهلة التحضير',
  steps: 'اغلي المياه ثم أضيفي المكرونة',
  country: 'مصر',
  region: 'القاهرة',
  UserId: userId,
});
assert(post.id, 'الوصفة أُنشئت');
assert(post.UserId === userId, 'الوصفة مرتبطة بالمستخدم');

// القراءة مع الصفحات (Pagination)
const result = await repositories.post.findAllWithUser(1, 10);
assert(Array.isArray(result.rows), 'الصفوف مصفوفة');
assert('page' in result && 'totalPages' in result, 'معلومات الصفحات موجودة');

// البحث حسب المستخدم
const userPosts = await repositories.post.findByUser(userId, 1, 10);
assert(userPosts.count >= 1, 'المستخدم لديه وصفة واحدة على الأقل');
```

### اختبار CommentRepository (التعليقات)

```javascript
// إنشاء تعليق
const comment = await repositories.comment.create({
  text: 'وصفة جميلة جداً',
  UserId: userId,
  PostId: postId,
});
assert(comment.id, 'التعليق أُنشئ');
assert(comment.text === 'وصفة جميلة جداً', 'نص التعليق صحيح');

// تعديل التعليق
await repositories.comment.updateText(comment.id, 'وصفة رائعة جداً');
const updated = await repositories.comment.findByPk(comment.id);
assert(updated.text === 'وصفة رائعة جداً', 'التعليق تم تحديثه');

// عدد التعليقات على منشور
const count = await repositories.comment.countByPost(postId);
assert(count >= 1, 'المنشور لديه تعليق واحد على الأقل');
```

### اختبار LikeRepository (الإعجابات)

```javascript
// إضافة إعجاب
const like = await repositories.like.create({
  UserId: userId,
  PostId: postId,
});
assert(like.id, 'الإعجاب أُضيف');

// منع تكرار الإعجاب
const duplicate = await repositories.like.findByUserAndPost(userId, postId);
assert(duplicate !== null, 'الإعجاب موجود — لا يمكن الإضافة مرة أخرى');

// حذف الإعجاب
await repositories.like.deleteByUserAndPost(userId, postId);
const deleted = await repositories.like.findByUserAndPost(userId, postId);
assert(deleted === null, 'الإعجاب حُذف');
```

---

## 5. ملف `comprehensive.test.js` — الاختبار الشامل

### الهدف

محاكاة **سيناريو استخدام كامل** من البداية للنهاية — كما يفعل مستخدم حقيقي.

### المراحل الست:

```
Phase 1: User Creation (إنشاء 3 مستخدمين)
    ↓
Phase 2: Create Posts (إنشاء وصفات)
    ↓
Phase 3: Create Comments (إضافة تعليقات)
    ↓
Phase 4: Like Management (إعجابات + منع التكرار)
    ↓
Phase 5: Update Operations (تعديل بيانات)
    ↓
Phase 6: Cascade Delete (حذف تتالي)
```

### مثال: Phase 2 — إنشاء الوصفات

```javascript
// إنشاء وصفة مكرونة
const post1 = await postRepo.create({
  title: 'طريقة المكرونة السريعة',
  content: 'مكرونة لذيذة وسهلة التحضير',
  steps: 'اغلي المياه ثم أضيفي المكرونة',
  country: 'مصر',
  region: 'القاهرة',
  UserId: user1.id,
});
assert(post1.id, 'وصفة 1 أُنشئت');

// إنشاء وصفة سلطة
const post2 = await postRepo.create({
  title: 'سلطة الخضروات الطازة',
  country: 'السعودية',
  UserId: user2.id,
});
assert(post2.id, 'وصفة 2 أُنشئت');

// التحقق من الصفحات
const page = await postRepo.findPaginated(1, 10);
assert(page.rows.length >= 2, 'وجدنا الوصفتين');
assert(page.count >= 2, 'العدد الكلي صحيح');
```

### مثال: Phase 6 — الحذف التتالي

```javascript
// تتبع كل ما يجب حذفه
testData = {
  users: [user1.id, user2.id, user3.id],
  posts: [post1.id, post2.id, post3.id],
  comments: [comment1.id, comment2.id, comment3.id],
  likes: [like1.id, like2.id],
};

// عند حذف مستخدم → Sequelize يحذف تلقائياً:
//   - منشوراته  (cascade)
//   - تعليقاته  (cascade)
//   - إعجاباته  (cascade)
for (const userId of testData.users) {
  await userRepo.delete(userId);
}

// تحقق من أن كل شيء حُذف
const remainingPosts = await postRepo.count({ where: { UserId: testData.users } });
assert(remainingPosts === 0, 'كل الوصفات حُذفت مع المستخدمين');
```

**لماذا الحذف التتالي مهم؟**

```
بدون cascade:
  المستخدم حُذف ✓
  وصفاته بقيت ❌ (orphan records!)
  تعليقاته بقيت ❌

مع cascade defined في Sequelize models:
  حذف المستخدم → يحذف تلقائياً كل ما يرتبط به ✓
```

---

## 6. نظام الفحوصات المخصص

الاختبارات تستخدم دوالاً مساعدة بسيطة بدلاً من framework خارجي:

```javascript
// فحص شرط
function assertTrue(condition, message) {
  state.total++;
  if (condition) {
    state.passed++;
    console.log(`${colors.green}✓ PASS: ${message}${colors.reset}`);
  } else {
    state.failed++;
    console.log(`${colors.red}✗ FAIL: ${message}${colors.reset}`);
  }
}

// عرض قسم
function logSection(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}
```

**مثال على المخرجات:**
```
────────────────────────────────────────────────────────────
  PHASE 1: USER AUTHENTICATION
────────────────────────────────────────────────────────────

Test 1: User Registration
✓ PASS: Registration returns 201
✓ PASS: Registration returns message

────────────────────────────────────────────────────────────
  PHASE 2: USER LOGIN
────────────────────────────────────────────────────────────

Test 2: User Login
✓ PASS: Login returns 200
✓ PASS: Login returns token

Total Tests: 15
Passed: 15
Failed: 0
Success Rate: 100.00%
```

---

## 7. الفرق بين الاختبارات

```
api.test.js
  ↑ المستوى الأعلى: اختبر "ماذا يرى المستخدم عبر HTTP"
  ↑ يشغّل خادم Express فعلي + اتصال DB حقيقي
  ↑ أبطأ، لكن يتحقق من السلوك الكامل

repositories.test.js
  ↑ المستوى الأوسط: اختبر "هل Sequelize يتصرف صحيحاً"
  ↑ بدون HTTP — يستدعي Repository مباشرة
  ↑ أسرع، يُحدد مشاكل قاعدة البيانات بدقة

comprehensive.test.js
  ↑ المستوى الأشمل: محاكاة سيناريو واقعي كامل
  ↑ يختبر تسلسل العمليات والعلاقات بين الكيانات
  ↑ يتضمن اختبار الحذف التتالي والتكامل

storage.test.js
  ↑ طبقة التخزين: اختبر النهج وخدمة التخزين مباشرة
  ↑ لا يحتاج قاعدة بيانات أو شبكة — مستقل تماماً
  ↑ تدعم وضعين: محلي (unit) + حي مع Cloudinary (integration)
```

---

## 8. خلاصة

```
لاختبار الـ API من الخارج          → api.test.js
لاختبار قاعدة البيانات            → repositories.test.js
لاختبار سيناريو كامل            → comprehensive.test.js
لاختبار طبقة التخزين (unit)      → storage.test.js
لاختبار Cloudinary حيّاً           → storage.test.js --CLOUDINARY_URL=...
```

---

*الدرس الثالث عشر من ثلاثة عشر — [← الدرس الثاني عشر: المدققات](./12-validators.md) | [فهرس الشروحات →](../README.md)*
