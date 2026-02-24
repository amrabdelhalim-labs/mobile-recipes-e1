/**
 * مكوّن عرض التعليقات (CommentList)
 * ─────────────────────────────────────
 * يعرض قائمة التعليقات الخاصة بمنشور معيّن.
 *
 * يستقبل:
 * ─ comments:     مصفوفة التعليقات الكاملة
 * ─ currentUserId: معرّف المستخدم الحالي (لإظهار زر الحذف لتعليقاته فقط)
 * ─ onDelete:     callback يُنفَّذ عند حذف تعليق
 * ─ isLoading:    حالة التحميل (يعرض Skeleton بدل القائمة)
 */
import {
  IonAvatar,
  IonButton,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonSkeletonText,
  IonText,
  useIonAlert,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import moment from 'moment';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import type { PostComment } from '../../types/post.types';
import './Comment.css';

interface CommentListProps {
  comments: PostComment[];
  currentUserId: number | null;
  onDelete: (commentId: number) => void;
  isLoading?: boolean;
}

/** هيكل تحميل وهمي لتعليق واحد */
const CommentSkeleton: React.FC = () => (
  <IonItem lines="none" className="comment-item">
    <IonAvatar slot="start" className="comment-avatar">
      <IonSkeletonText animated />
    </IonAvatar>
    <IonLabel>
      <IonSkeletonText animated style={{ width: '30%', height: '14px' }} />
      <IonSkeletonText animated style={{ width: '80%', height: '12px', marginTop: '6px' }} />
      <IonSkeletonText animated style={{ width: '20%', height: '10px', marginTop: '4px' }} />
    </IonLabel>
  </IonItem>
);

const CommentList: React.FC<CommentListProps> = ({
  comments,
  currentUserId,
  onDelete,
  isLoading = false,
}) => {
  const { getProfileImageUrl } = useContext(AuthContext);
  const [presentAlert] = useIonAlert();

  const handleDelete = (commentId: number) => {
    presentAlert({
      header: 'حذف التعليق',
      message: 'هل أنت متأكد من حذف هذا التعليق؟',
      buttons: [
        { text: 'إلغاء', role: 'cancel' },
        {
          text: 'حذف',
          role: 'destructive',
          handler: () => onDelete(commentId),
        },
      ],
    });
  };

  // ─── حالة التحميل ───
  if (isLoading) {
    return (
      <IonList className="comments-list" lines="none">
        {[1, 2, 3].map((i) => (
          <CommentSkeleton key={i} />
        ))}
      </IonList>
    );
  }

  // ─── لا توجد تعليقات ───
  if (comments.length === 0) {
    return (
      <div className="comments-empty">
        <IonText color="medium">
          <p>لا توجد تعليقات بعد. كن أول من يعلق!</p>
        </IonText>
      </div>
    );
  }

  return (
    <IonList className="comments-list" lines="none">
      {comments.map((comment) => (
        <IonItem key={comment.id} className="comment-item" lines="none">
          <IonAvatar slot="start" className="comment-avatar">
            <IonImg src={getProfileImageUrl(comment.User?.ImageUrl)} alt={comment.User?.name} />
          </IonAvatar>

          <IonLabel className="comment-body">
            <div className="comment-header">
              <IonText className="comment-author">{comment.User?.name}</IonText>
              <IonText color="medium" className="comment-time">
                {moment(comment.createdAt).fromNow()}
              </IonText>
            </div>
            <IonText className="comment-text">{comment.text}</IonText>
          </IonLabel>

          {/* زر الحذف — يظهر فقط لتعليقات المستخدم الحالي */}
          {(currentUserId === comment.UserId || currentUserId === comment.User?.id) && (
            <IonButton
              fill="clear"
              size="small"
              color="danger"
              slot="end"
              className="comment-delete-btn"
              onClick={() => handleDelete(comment.id)}
            >
              <IonIcon icon={trashOutline} slot="icon-only" />
            </IonButton>
          )}
        </IonItem>
      ))}
    </IonList>
  );
};

export default CommentList;
