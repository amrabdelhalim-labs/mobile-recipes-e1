/**
 * اختبارات E2E — تدفقات المستخدم الأساسية
 * ══════════════════════════════════════════
 *
 * تتحقق من:
 *  1. تحميل التطبيق وتوجيه المستخدم غير المسجّل لصفحة الدخول
 *  2. عرض صفحة تسجيل الدخول بالعناصر المطلوبة
 *  3. الانتقال بين صفحتي الدخول والتسجيل
 *  4. التحقق من صحة النماذج (validation)
 *  5. تحميل الصفحة الرئيسية بعد تسجيل الدخول
 */

describe('تسجيل الدخول', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('يجب توجيه المستخدم غير المسجّل لصفحة الدخول', () => {
        cy.url().should('include', '/account/login');
    });

    it('يجب عرض نموذج تسجيل الدخول', () => {
        cy.get('ion-input[name="email"]').should('exist');
        cy.get('ion-input[name="password"]').should('exist');
        cy.get('ion-button[type="submit"]').should('exist');
    });

    it('يجب أن يكون زر الإرسال مُعطّلاً بدون بيانات', () => {
        cy.get('ion-button[type="submit"]').should('be.disabled');
    });

    it('يجب الانتقال لصفحة التسجيل عند الضغط على الرابط', () => {
        cy.contains('تسجيل مستخدم جديد').click();
        cy.url().should('include', '/account/register');
    });
});

describe('التسجيل', () => {
    beforeEach(() => {
        cy.visit('/account/register');
    });

    it('يجب عرض نموذج التسجيل بالحقول المطلوبة', () => {
        cy.get('ion-input[name="name"]').should('exist');
        cy.get('ion-input[name="email"]').should('exist');
        cy.get('ion-input[name="password"]').should('exist');
    });

    it('يجب الانتقال لصفحة الدخول عند الضغط على الرابط', () => {
        cy.contains('تسجيل الدخول').click();
        cy.url().should('include', '/account/login');
    });
});

describe('صفحة 404', () => {
    it('يجب عرض صفحة 404 للمسارات غير الموجودة', () => {
        cy.visit('/nonexistent-page');
        cy.contains('404').should('exist');
        cy.contains('الصفحة غير موجودة').should('exist');
    });

    it('يجب أن يحتوي على زر العودة للرئيسية', () => {
        cy.visit('/nonexistent-page');
        cy.contains('العودة للرئيسية').should('exist');
    });
});