/**
 * مكوّن بطاقة المنشور (PostCard)
 * ──────────────────────────────
 * مكوّن مشترك يُستخدم في صفحتَي AllPosts و MyPosts.
 *
 * الاختلافات بين الصفحتين تُدار عبر props:
 * ─ showAuthor:  true في AllPosts (عرض صورة المؤلف واسمه)
 *                false في MyPosts (المستخدم يعرف أنها منشوراته)
 * ─ onOptions:   callback اختياري — عند تمريره يُعرض زر ⋮ (خيارات)
 *                يُستخدم في MyPosts لفتح ActionSheet (تعديل/حذف)
 * ─ routerLink:  الرابط الذي ينتقل إليه عند الضغط على البطاقة
 *
 * المكوّن يعرض أيضًا عدد التعليقات والإعجابات بدون تفاعل مباشر،
 * لأن التفاعل يتم داخل صفحة المنشور المفرد (PostDetail).
 */
import {
    IonAvatar,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCol,
    IonGrid,
    IonIcon,
    IonImg,
    IonRow,
    IonText,
} from '@ionic/react';
import {
    chatbubbleOutline,
    heartOutline,
    heart,
    ellipsisVertical,
} from 'ionicons/icons';
import moment from 'moment';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import type { Post } from '../../types/post.types';
import './PostCard.css';

interface PostCardProps {
    /** بيانات المنشور */
    post: Post;
    /** عرض بيانات المؤلف (الصورة والاسم) — true في AllPosts */
    showAuthor?: boolean;
    /** الرابط الذي ينتقل إليه عند الضغط على البطاقة */
    routerLink?: string;
    /** callback يُنفَّذ عند الضغط على زر الخيارات — يُعرض الزر فقط إن مُرِّر */
    onOptions?: (post: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({
    post,
    showAuthor = true,
    routerLink,
    onOptions,
}) => {
    const { getProfileImageUrl } = useContext(AuthContext);

    // أول صورة للمنشور (إن وُجدت) أو صورة افتراضية
    const coverImage = post.images?.[0]?.imageUrl
        ? getProfileImageUrl(post.images[0].imageUrl)
        : 'https://ionicframework.com/docs/img/demos/card-media.png';

    // عدد التعليقات والإعجابات
    const commentsCount = post.Comments?.length ?? 0;
    const likesCount = post.likesCount ?? 0;

    return (
        <IonCol size="12" sizeMd="6" sizeLg="6" sizeXl="4" key={post.id}>
            <IonCard
                className="post-card"
                routerLink={routerLink}
                button={!!routerLink}
            >
                {/* ─── صورة الغلاف (دائماً معروضة) ─── */}
                <IonImg
                    src={coverImage}
                    alt={post.title}
                    className="post-card-image"
                />

                <IonCardContent>
                    <IonGrid className="ion-no-padding">
                        {/* ─── صف المعلومات: المؤلف/التاريخ | الإحصائيات | الخيارات ─── */}
                        <IonRow className="ion-align-items-center ion-justify-content-between post-card-header">
                            {/* الجزء الأيسر: معلومات المؤلف أو التاريخ */}
                            <IonCol size="auto" className="ion-no-padding">
                                {showAuthor && post.User && (
                                    <div className="post-card-author">
                                        <IonAvatar className="post-card-avatar">
                                            <IonImg
                                                src={getProfileImageUrl(post.User.ImageUrl)}
                                                alt={post.User.name}
                                            />
                                        </IonAvatar>
                                        <div className="post-card-author-info">
                                            <IonText className="post-card-author-name">
                                                {post.User.name}
                                            </IonText>
                                            <IonText color="medium" className="post-card-time">
                                                {moment(post.createdAt).fromNow()}
                                            </IonText>
                                        </div>
                                    </div>
                                )}

                                {/* في MyPosts: فقط التاريخ */}
                                {!showAuthor && (
                                    <IonText color="medium" className="post-card-time">
                                        {moment(post.createdAt).fromNow()}
                                    </IonText>
                                )}
                            </IonCol>

                            {/* الجزء الأيمن: الإحصائيات والخيارات */}
                            <IonCol size="auto" className="ion-no-padding">
                                <div className="post-card-actions">
                                    {/* الإحصائيات */}
                                    <div className="post-card-stats">
                                        <div className="post-card-stat">
                                            <IonIcon
                                                icon={post.isLiked ? heart : heartOutline}
                                                color={post.isLiked ? 'danger' : 'medium'}
                                            />
                                            <IonText color="medium">{likesCount}</IonText>
                                        </div>
                                        <div className="post-card-stat">
                                            <IonIcon icon={chatbubbleOutline} color="medium" />
                                            <IonText color="medium">{commentsCount}</IonText>
                                        </div>
                                    </div>

                                    {/* زر الخيارات (فقط في MyPosts) */}
                                    {onOptions && (
                                        <IonButton
                                            fill="clear"
                                            size="small"
                                            className="post-card-options-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                onOptions(post);
                                            }}
                                        >
                                            <IonIcon
                                                icon={ellipsisVertical}
                                                slot="icon-only"
                                                color="medium"
                                            />
                                        </IonButton>
                                    )}
                                </div>
                            </IonCol>
                        </IonRow>

                        {/* ─── العنوان والوصف ─── */}
                        <IonCardTitle className="post-card-title" color="primary">
                            {post.title}
                        </IonCardTitle>
                        <IonCardSubtitle className="post-card-content">
                            {post.content}
                        </IonCardSubtitle>
                    </IonGrid>
                </IonCardContent>
            </IonCard>
        </IonCol>
    );
};

export default PostCard;
