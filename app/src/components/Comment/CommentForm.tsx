/**
 * مكوّن إضافة تعليق (CommentForm)
 * ─────────────────────────────────
 * حقل إدخال نص + زر إرسال لإضافة تعليق جديد على منشور.
 *
 * يستقبل:
 * ─ postId:   معرّف المنشور
 * ─ onAdded:  callback يُنفَّذ بعد الإضافة الناجحة (يمرر التعليق الكامل)
 */
import { IonButton, IonIcon, IonSpinner, IonTextarea, useIonToast } from '@ionic/react';
import { send } from 'ionicons/icons';
import { useState, useCallback } from 'react';
import api from '../../config/axios';
import { ADD_COMMENT } from '../../config/urls';
import type { PostComment } from '../../types/post.types';
import './Comment.css';

interface CommentFormProps {
  postId: number;
  onAdded: (comment: PostComment) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, onAdded }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [presentToast] = useIonToast();

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      presentToast({
        message: 'اكتب تعليقاً أولاً',
        duration: 3000,
        color: 'warning',
        position: 'bottom',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await api.post(ADD_COMMENT(postId), { text: trimmed });
      setText('');
      onAdded(data.comment);
      presentToast({
        message: 'تم إضافة التعليق بنجاح',
        duration: 3000,
        color: 'success',
        position: 'bottom',
      });
    } catch {
      presentToast({
        message: 'فشل إضافة التعليق، حاول مرة أخرى',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [text, postId, onAdded, presentToast]);

  return (
    <div className="create-comment">
      <IonTextarea
        className="create-comment-input"
        placeholder="اكتب تعليقاً..."
        value={text}
        onIonInput={(e) => setText(e.detail.value ?? '')}
        rows={2}
        autoGrow
        disabled={isSubmitting}
      />
      <IonButton
        className="create-comment-btn"
        fill="clear"
        size="small"
        onClick={handleSubmit}
        disabled={isSubmitting || !text.trim()}
      >
        {isSubmitting ? <IonSpinner name="crescent" /> : <IonIcon icon={send} slot="icon-only" />}
      </IonButton>
    </div>
  );
};

export default CommentForm;
