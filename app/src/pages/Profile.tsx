import { useContext, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonLoading,
  IonPage,
  IonRow,
  IonText,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { useHistory } from 'react-router';
import { AxiosError } from 'axios';
import Header from '../components/Header/Header';
import UserAvatar from '../components/UserProfile/UserAvatar';
import EditableField from '../components/UserProfile/EditableField';
import { AuthContext } from '../context/AuthContext';
import { PROFILE_UPDATE_INFO_URL, PROFILE_DELETE_URL, LOGIN_URL } from '../config/urls';
import api from '../config/axios';
import './Profile.css';

const Profile: React.FC = () => {
  const { user, fetchProfile, logout } = useContext(AuthContext);
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  /**
   * تحديث بيانات المستخدم (الاسم أو كلمة المرور)
   * السيرفر: PUT /account/profile/info
   * يقبل { name?, password? } — كل واحد اختياري
   * يرجع { message, user }
   */
  const handleUpdateField = async (
    field: 'name' | 'password',
    newValue: string
  ): Promise<boolean> => {
    try {
      await api.put(PROFILE_UPDATE_INFO_URL, { [field]: newValue });
      // تحديث بيانات المستخدم في AuthContext
      await fetchProfile();
      return true;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      console.error(`فشل تحديث ${field}:`, err.response?.data?.message ?? err.message);
      return false;
    }
  };

  /**
   * حذف الحساب نهائيًا
   * السيرفر: DELETE /account/profile
   * يحذف المستخدم + منشوراته + صوره من القرص (CASCADE)
   */
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete(PROFILE_DELETE_URL);
      await logout();
      history.replace(`/${LOGIN_URL}`);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      console.error('فشل حذف الحساب:', err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <Header title="الملف الشخصي" />

      <IonLoading isOpen={loading} message="جارٍ التنفيذ..." />

      {/* رسالة تأكيد حذف الحساب */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="تحذير!"
        subHeader="حذف الحساب نهائيًا"
        message="سيتم حذف حسابك وجميع منشوراتك وتعليقاتك وإعجاباتك. هذا الإجراء لا يمكن التراجع عنه."
        buttons={[
          { text: 'إلغاء', role: 'cancel' },
          {
            text: 'حذف الحساب',
            cssClass: 'alert-button-danger',
            handler: handleDeleteAccount,
          },
        ]}
      />

      <IonContent>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="6" sizeLg="4">
              {/* ─── القسم العلوي: الصورة + الاسم + الإيميل ─── */}
              <div className="profile-hero ion-text-center">
                <UserAvatar />

                <div className="profile-user-info">
                  <IonText color="primary">
                    <h2>{user?.name ?? 'مستخدم'}</h2>
                  </IonText>
                  <IonText color="medium">
                    <p>{user?.email ?? ''}</p>
                  </IonText>
                </div>
              </div>

              {/* ─── حقول البيانات القابلة للتعديل ─── */}
              <div className="profile-fields">
                <IonText color="dark">
                  <p className="profile-fields-title">بيانات الحساب</p>
                </IonText>

                {/* الاسم — قابل للتعديل، حد أدنى 3 أحرف (مطابق للسيرفر) */}
                <EditableField
                  label="الاسم"
                  value={user?.name ?? ''}
                  minLength={3}
                  validationMessage="يجب أن يكون الاسم 3 أحرف على الأقل"
                  onSave={(val) => handleUpdateField('name', val)}
                />

                {/* البريد الإلكتروني — للقراءة فقط */}
                <EditableField
                  label="البريد الإلكتروني"
                  value={user?.email ?? ''}
                  readOnly
                  onSave={async () => false}
                />

                {/* كلمة المرور — قابلة للتعديل، حد أدنى 6 أحرف (مطابق للسيرفر) */}
                <EditableField
                  label="كلمة المرور"
                  value=""
                  type="password"
                  minLength={6}
                  validationMessage="يجب أن تكون كلمة المرور 6 أحرف على الأقل"
                  onSave={(val) => handleUpdateField('password', val)}
                />
              </div>

              {/* ─── زر حذف الحساب ─── */}
              <div className="profile-delete-section">
                <IonButton
                  expand="block"
                  color="danger"
                  fill="outline"
                  onClick={() => setShowDeleteAlert(true)}
                >
                  <IonIcon icon={trashOutline} slot="start" />
                  حذف الحساب
                </IonButton>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
