/**
 * صفحة جميع المنشورات (AllPosts)
 * ────────────────────────────────
 * تجلب المنشورات من السيرفر: GET /posts?page=N&limit=10
 * الاستجابة: { posts: Post[], pagination: Pagination }
 *
 * الميزات:
 * ─ Pull-to-refresh لإعادة تحميل المنشورات
 * ─ Infinite scroll لتحميل المزيد تلقائيًا عند التمرير
 * ─ عرض المؤلف (صورة + اسم) والوقت النسبي (moment)
 * ─ عرض عدد الإعجابات والتعليقات (بدون تفاعل مباشر)
 * ─ الضغط على البطاقة ينقل لصفحة المنشور المفرد
 * ─ حالة فارغة إذا لم توجد منشورات
 *
 * يستخدم مكوّن PostCard المشترك مع showAuthor=true
 * ولا يُمرّر onOptions (لا خيارات تعديل/حذف — فقط في MyPosts)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import Header from '../components/Header/Header';
import PostCard from '../components/PostCard/PostCard';
import api from '../config/axios';
import { GET_ALL_POSTS } from '../config/urls';
import type { Post, PostsResponse } from '../types/post.types';
import { onPostsChanged } from '../utils/postsEvents';
import './AllPosts.css';

const AllPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ref لمنع الجلب المتكرر أثناء طلب جارٍ
  const isFetching = useRef(false);

  /**
   * جلب المنشورات من السيرفر
   * @param page رقم الصفحة
   * @param replace true = استبدال القائمة (refresh)، false = إلحاق (infinite scroll)
   */
  const fetchPosts = useCallback(async (page: number, replace = false) => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      if (replace) setLoading(true);

      const res = await api.get<PostsResponse>(GET_ALL_POSTS, {
        params: { page, limit: 10 },
      });

      const { posts: newPosts, pagination } = res.data;

      setPosts((prev) => (replace ? newPosts : [...prev, ...newPosts]));
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('فشل جلب المنشورات:', error);
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

  /** Pull-to-refresh: إعادة تحميل من الصفحة الأولى */
  const handleRefresh = async (event: CustomEvent) => {
    await fetchPosts(1, true);
    event.detail.complete();
  };

  /** Infinite scroll: تحميل الصفحة التالية */
  const handleInfinite = async (event: CustomEvent) => {
    if (currentPage < totalPages) {
      await fetchPosts(currentPage + 1, false);
    }
    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  return (
    <IonPage>
      <Header title="المنشورات" showBackButton={false} />

      <IonLoading isOpen={loading} message="جار التحميل..." />

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
                        showAuthor={true}
                        routerLink={`/tabs/posts/${post.id}`}
                      />
                    ))}

                  {/* ─── حالة فارغة ─── */}
                  {!loading && posts.length === 0 && (
                    <IonCol size="12">
                      <IonCard className="ion-padding ion-text-center">
                        <IonCardTitle color="primary">لا توجد منشورات لعرضها</IonCardTitle>
                        <IonText color="medium">
                          <p>اسحب للأسفل لإعادة المحاولة</p>
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

export default AllPosts;
