/**
 * مكوّن الإعجاب (Like)
 * ─────────────────────
 * زر toggle للإعجاب/إلغاء الإعجاب بمنشور.
 *
 * يستقبل:
 * ─ postId:       معرّف المنشور
 * ─ initialLiked: هل المستخدم أعجب بالمنشور مسبقاً
 * ─ initialCount: عدد الإعجابات الحالي
 * ─ onToggle:     callback اختياري يُنفَّذ بعد التبديل (يمرر isLiked و likesCount)
 *
 * يُجري Optimistic Update: يعكس الحالة فوراً ثم يتحقق من السيرفر.
 */
import { IonButton, IonIcon, IonText } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';
import { useState, useCallback } from 'react';
import api from '../../config/axios';
import { TOGGLE_LIKE } from '../../config/urls';
import { emitPostsChanged } from '../../utils/postsEvents';

interface LikeProps {
  postId: number;
  initialLiked: boolean;
  initialCount: number;
  onToggle?: (isLiked: boolean, likesCount: number) => void;
}

const Like: React.FC<LikeProps> = ({ postId, initialLiked, initialCount, onToggle }) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    // Optimistic update
    const prevLiked = isLiked;
    const prevCount = likesCount;
    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newLiked);
    setLikesCount(newCount);

    try {
      const { data } = await api.post(TOGGLE_LIKE(postId));
      // مزامنة مع استجابة السيرفر
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
      onToggle?.(data.isLiked, data.likesCount);
      emitPostsChanged();
    } catch {
      // Rollback في حالة الخطأ
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isLiked, likesCount, postId, onToggle]);

  return (
    <IonButton
      fill="clear"
      size="small"
      className="like-btn"
      onClick={toggleLike}
      disabled={isLoading}
    >
      <IonIcon
        icon={isLiked ? heart : heartOutline}
        color={isLiked ? 'danger' : 'medium'}
        slot="start"
      />
      <IonText color="medium">{likesCount}</IonText>
    </IonButton>
  );
};

export default Like;
