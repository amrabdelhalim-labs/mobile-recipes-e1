import { useState } from 'react';
import { IonItem, IonLabel, IonInput, IonIcon, IonAlert } from '@ionic/react';
import { createOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
import './EditableField.css';

interface EditableFieldProps {
  label: string; // اسم الحقل (مثلاً "الاسم" أو "كلمة المرور")
  value: string; // القيمة الحالية لعرضها (ستُخفي في حالة كلمة المرور)
  type?: 'text' | 'password'; // نوع الحقل (افتراضي "text"، استخدم "password" لإخفاء القيمة)
  readOnly?: boolean; // هل الحقل للقراءة فقط بدون تعديل؟
  minLength?: number; // الحد الأدنى لعدد الأحرف (للتحقق قبل الحفظ)
  validationMessage?: string; // رسالة خطأ التحقق
  onSave: (newValue: string) => Promise<boolean>; // دالة تُستدعى عند تأكيد الحفظ وترجع true عند النجاح
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  type = 'text',
  readOnly = false,
  minLength,
  validationMessage,
  onSave,
}) => {
  // وضع التعديل: false = عرض فقط، true = حقل قابل للكتابة
  const [editing, setEditing] = useState(false);
  // القيمة المُعدّلة أثناء التحرير
  const [editValue, setEditValue] = useState(value);
  // إظهار رسالة التأكيد قبل الحفظ
  const [showConfirm, setShowConfirm] = useState(false);
  // رسالة خطأ التحقق المحلي
  const [error, setError] = useState<string | null>(null);
  // حالة التحميل أثناء الحفظ
  const [saving, setSaving] = useState(false);

  /** بدء وضع التعديل */
  const startEditing = () => {
    setEditValue(type === 'password' ? '' : value);
    setError(null);
    setEditing(true);
  };

  /** إلغاء التعديل والعودة لوضع القراءة */
  const cancelEditing = () => {
    setEditValue(value);
    setError(null);
    setEditing(false);
  };

  /** التحقق وإظهار رسالة التأكيد */
  const handleSaveClick = () => {
    // التحقق من القيمة
    const trimmed = editValue.trim();
    if (!trimmed) {
      setError(`يجب إدخال ${label}`);
      return;
    }
    if (minLength && trimmed.length < minLength) {
      setError(validationMessage ?? `يجب أن يكون ${label} ${minLength} أحرف على الأقل`);
      return;
    }
    // إذا لم تتغير القيمة (لحقول غير كلمة المرور)
    if (type !== 'password' && trimmed === value) {
      cancelEditing();
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  /** تنفيذ الحفظ الفعلي بعد التأكيد */
  const confirmSave = async () => {
    setSaving(true);
    const success = await onSave(editValue.trim());
    setSaving(false);
    if (success) {
      setEditing(false);
    }
  };

  return (
    <>
      <IonItem className="editable-field" lines="inset">
        {editing ? (
          // ─── وضع التعديل ─── حقل إدخال + أيقونتي حفظ/إلغاء
          <>
            <IonLabel position="stacked">{label}</IonLabel>
            <IonInput
              type={type}
              value={editValue}
              placeholder={
                type === 'password' ? 'أدخل كلمة المرور الجديدة' : `أدخل ${label} الجديد`
              }
              onIonInput={(e) => setEditValue(e.detail.value ?? '')}
              autofocus
              disabled={saving}
            />
            <div slot="end" className="editable-field-actions">
              <IonIcon
                icon={checkmarkOutline}
                className="editable-field-btn save-btn"
                onClick={handleSaveClick}
              />
              <IonIcon
                icon={closeOutline}
                className="editable-field-btn cancel-btn"
                onClick={cancelEditing}
              />
            </div>
          </>
        ) : (
          // ─── وضع العرض ─── نص + أيقونة تعديل
          <>
            <IonLabel position="stacked">{label}</IonLabel>
            <IonInput value={type === 'password' ? '••••••••' : value} disabled />
            {!readOnly && (
              <IonIcon
                slot="end"
                icon={createOutline}
                className="editable-field-btn edit-btn"
                onClick={startEditing}
              />
            )}
          </>
        )}
      </IonItem>

      {/* رسالة خطأ التحقق */}
      {error && <p className="editable-field-error">{error}</p>}

      {/* رسالة تأكيد الحفظ تعرض القيمة الجديدة */}
      <IonAlert
        isOpen={showConfirm}
        onDidDismiss={() => setShowConfirm(false)}
        header="تأكيد التعديل"
        message={
          type === 'password'
            ? `هل تريد تغيير ${label}؟`
            : `هل تريد تغيير ${label} إلى "${editValue.trim()}"؟`
        }
        buttons={[
          { text: 'إلغاء', role: 'cancel' },
          { text: 'حفظ', handler: confirmSave },
        ]}
      />
    </>
  );
};

export default EditableField;
