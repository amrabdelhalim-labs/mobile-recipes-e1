/**
 * صفحة منشوراتي (MyPosts)
 * ────────────────────────
 * تجلب منشورات المستخدم الحالي من السيرفر: GET /posts/me?page=N&limit=10
 * الاستجابة: { posts: Post[], pagination: Pagination }
 *
 * الميزات:
 * ─ عرض بطاقات المنشورات بدون بيانات المؤلف (showAuthor=false)
 * ─ زر خيارات ⋮ لكل بطاقة يفتح IonActionSheet:
 *     • الانتقال للمنشور → صفحة المنشور المفرد
 *     • تعديل المنشور → صفحة التعديل
 *     • حذف المنشور → تأكيد بـ IonAlert ثم DELETE /posts/:id
 * ─ Infinite scroll لتحميل المزيد
 * ─ حالة فارغة عند عدم وجود منشورات
 *
 * يستخدم مكوّن PostCard المشترك مع showAuthor=false و onOptions
 *
 * حذف المنشور:
 * السيرفر يقبل: DELETE /posts/:id
 * يتحقق أن المنشور يخص المستخدم الحالي
 * يحذف الصور من القرص + المنشور + التعليقات + الإعجابات (CASCADE)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonActionSheet,
  IonAlert,
  IonCard,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLoading,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonText,
  useIonViewWillEnter,
} from '@ionic/react';
import { eyeOutline, createOutline, trashOutline, closeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router';
import Header from '../components/Header/Header';
import PostCard from '../components/PostCard/PostCard';
import api from '../config/axios';
import { GET_MY_POSTS, DELETE_POST } from '../config/urls';
import type { Post, PostsResponse } from '../types/post.types';
import { onPostsChanged, emitPostsChanged } from '../utils/postsEvents';

const MyPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // إدارة ActionSheet
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // إدارة تأكيد الحذف
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const isFetching = useRef(false);
  const history = useHistory();

  /**
   * جلب منشورات المستخدم الحالي
   * @param page رقم الصفحة
   * @param replace true = استبدال (refresh)، false = إلحاق (infinite)
   */
  const fetchPosts = useCallback(async (page: number, replace = false) => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      if (replace) setLoading(true);

      const res = await api.get<PostsResponse>(GET_MY_POSTS, {
        params: { page, limit: 10 },
      });

      const { posts: newPosts, pagination } = res.data;

      setPosts((prev) => (replace ? newPosts : [...prev, ...newPosts]));
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('فشل جلب منشوراتي:', error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  // جلب البيانات عند دخول الصفحة (وأيضًا عند الرجوع إليها)
  useIonViewWillEnter(() => {
    fetchPosts(1, true);
  });

  // تحديث تلقائي عند حدوث أي تغيير في المنشورات
  useEffect(() => {
    return onPostsChanged(() => {
      fetchPosts(1, true);
    });
  }, [fetchPosts]);

  /** Pull-to-refresh */
  const handleRefresh = async (event: CustomEvent) => {
    await fetchPosts(1, true);
    event.detail.complete();
  };

  /** Infinite scroll */
  const handleInfinite = async (event: CustomEvent) => {
    if (currentPage < totalPages) {
      await fetchPosts(currentPage + 1, false);
    }
    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  /** فتح ActionSheet عند الضغط على زر الخيارات في البطاقة */
  const handleOptions = (post: Post) => {
    setSelectedPost(post);
    setShowActionSheet(true);
  };

  /**
   * حذف المنشور
   * السيرفر: DELETE /posts/:id
   * يحذف الصور من القرص + جميع العلاقات (CASCADE)
   */
  const handleDeletePost = async () => {
    if (!selectedPost) return;

    setLoading(true);
    try {
      await api.delete(DELETE_POST(selectedPost.id));
      // إزالة المنشور من القائمة محليًا بدون إعادة جلب
      setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
      emitPostsChanged();
    } catch (error) {
      console.error('فشل حذف المنشور:', error);
    } finally {
      setLoading(false);
      setSelectedPost(null);
    }
  };

  return (
    <IonPage>
      <Header title="منشوراتي" />

      <IonLoading isOpen={loading} message="جار التحميل..." />

      {/* ─── ActionSheet: خيارات المنشور ─── */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header="خيارات المنشور"
        buttons={[
          {
            text: 'الانتقال للمنشور',
            icon: eyeOutline,
            handler: () => {
              if (selectedPost) {
                history.push(`/tabs/posts/${selectedPost.id}`);
              }
            },
          },
          {
            text: 'تعديل المنشور',
            icon: createOutline,
            handler: () => {
              if (selectedPost) {
                history.push(`/tabs/posts/${selectedPost.id}/edit`);
              }
            },
          },
          {
            text: 'حذف المنشور',
            icon: trashOutline,
            role: 'destructive',
            handler: () => {
              setShowDeleteAlert(true);
            },
          },
          {
            text: 'إلغاء',
            icon: closeOutline,
            role: 'cancel',
          },
        ]}
      />

      {/* ─── تأكيد حذف المنشور ─── */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="تنبيه!"
        message="هل تريد بالفعل حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء."
        buttons={[
          { text: 'إلغاء', role: 'cancel' },
          {
            text: 'حذف',
            cssClass: 'alert-button-danger',
            handler: handleDeletePost,
          },
        ]}
      />

      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonGrid className="posts-container">
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeLg="10" sizeXl="8">
              <IonGrid className="ion-no-padding">
                <IonRow>
                  {/* ─── قائمة المنشورات ─── */}
                  {!loading &&
                    posts.length > 0 &&
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        showAuthor={false}
                        routerLink={`/tabs/posts/${post.id}`}
                        onOptions={handleOptions}
                      />
                    ))}

                  {/* ─── حالة فارغة ─── */}
                  {!loading && posts.length === 0 && (
                    <IonCol size="12">
                      <IonCard className="ion-padding ion-text-center">
                        <IonCardTitle color="primary">لا توجد منشورات لعرضها</IonCardTitle>
                        <IonText color="medium">
                          <p>ابدأ بإنشاء منشورك الأول!</p>
                        </IonText>
                      </IonCard>
                    </IonCol>
                  )}
                </IonRow>
              </IonGrid>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* ─── Infinite Scroll ─── */}
        <IonInfiniteScroll
          disabled={currentPage >= totalPages}
          onIonInfinite={handleInfinite}
          threshold="200px"
        >
          <IonInfiniteScrollContent loadingText="جار تحميل المزيد..." />
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default MyPosts;
