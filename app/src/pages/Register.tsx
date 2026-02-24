import {
  IonAlert,
  IonAvatar,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonLoading,
  IonPage,
  IonRouterLink,
  IonRow,
  IonText,
} from '@ionic/react';
import { personAddOutline } from 'ionicons/icons';
import { Formik, type FormikHelpers } from 'formik';
import * as yup from 'yup';
import { useState, useContext, useEffect } from 'react';
import { useHistory } from 'react-router';
import { AxiosError } from 'axios';
import Header from '../components/Header/Header';
import api from '../config/axios';
import { REGISTER_URL, LOGIN_URL } from '../config/urls';
import { AuthContext } from '../context/AuthContext';
import './Register.css';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
}

const initialValues: RegisterFormValues = {
  name: '',
  email: '',
  password: '',
};

// مطابق لقواعد التحقق في السيرفر: name min 3, email valid, password min 6
const validationSchema = yup.object<RegisterFormValues>({
  name: yup
    .string()
    .required('يجب عليك إدخال اسم المستخدم')
    .min(3, 'يجب أن يكون الاسم 3 أحرف على الأقل'),
  email: yup
    .string()
    .required('يجب عليك إدخال البريد الإلكتروني')
    .email('يجب عليك إدخال بريد إلكتروني صحيح'),
  password: yup
    .string()
    .required('يجب عليك إدخال كلمة المرور')
    .min(6, 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'),
});

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);
  const [errorAlert, setErrorAlert] = useState(false);

  const { loggedIn, jwt } = useContext(AuthContext);
  const history = useHistory();

  // التوجيه التلقائي: إذا كان المستخدم مسجل الدخول بالفعل يُوجّه للرئيسية
  useEffect(() => {
    if (loggedIn && jwt) {
      history.replace('/tabs/home');
    }
  }, [loggedIn, jwt, history]);

  const handleRegister = async (
    values: RegisterFormValues,
    { resetForm }: FormikHelpers<RegisterFormValues>
  ) => {
    setLoading(true);
    try {
      await api.post(REGISTER_URL, values);
      setSuccessAlert(true);
      resetForm();
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 400) {
        setErrorAlert(true);
      } else {
        console.error('Registration error:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <Header title="تسجيل مستخدم جديد" showMenuButton={false} defaultHref={`/${LOGIN_URL}`} />

      <IonLoading isOpen={loading} message="جارٍ إنشاء الحساب..." />

      <IonAlert
        isOpen={successAlert}
        onDidDismiss={() => setSuccessAlert(false)}
        header="تم بنجاح!"
        subHeader="لقد تم تسجيل حسابك"
        message="يمكنك الانتقال إلى صفحة تسجيل الدخول"
        buttons={[
          {
            text: 'تسجيل الدخول',
            handler: () => history.push(`/${LOGIN_URL}`),
          },
        ]}
      />

      <IonAlert
        isOpen={errorAlert}
        onDidDismiss={() => setErrorAlert(false)}
        header="تنبيه!"
        subHeader="البريد الإلكتروني مستخدم"
        message="هذا البريد الإلكتروني مسجّل بالفعل. هل ترغب بتسجيل الدخول؟"
        buttons={[
          {
            text: 'تسجيل الدخول',
            handler: () => history.push(`/${LOGIN_URL}`),
          },
          { text: 'إلغاء', role: 'cancel' },
        ]}
      />

      <IonContent>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="6" sizeLg="4">
              <div className="register-hero ion-text-center ion-padding">
                <IonAvatar className="register-avatar">
                  <IonIcon icon={personAddOutline} className="register-icon" />
                </IonAvatar>
                <IonText color="primary">
                  <h2>إنشاء حساب جديد</h2>
                </IonText>
              </div>

              <Formik<RegisterFormValues>
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleRegister}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isValid,
                  dirty,
                }) => (
                  <form onSubmit={handleSubmit} noValidate>
                    <IonItem
                      className={`register-field ${touched.name && errors.name ? 'ion-invalid' : ''}`}
                    >
                      <IonLabel position="stacked">الاسم</IonLabel>
                      <IonInput
                        name="name"
                        type="text"
                        value={values.name}
                        onIonChange={handleChange}
                        onIonBlur={handleBlur}
                      />
                    </IonItem>
                    {touched.name && errors.name && (
                      <IonText color="danger" className="field-error">
                        <small>{errors.name}</small>
                      </IonText>
                    )}

                    <IonItem
                      className={`register-field ${touched.email && errors.email ? 'ion-invalid' : ''}`}
                    >
                      <IonLabel position="stacked">البريد الإلكتروني</IonLabel>
                      <IonInput
                        name="email"
                        type="email"
                        value={values.email}
                        onIonChange={handleChange}
                        onIonBlur={handleBlur}
                      />
                    </IonItem>
                    {touched.email && errors.email && (
                      <IonText color="danger" className="field-error">
                        <small>{errors.email}</small>
                      </IonText>
                    )}

                    <IonItem
                      className={`register-field ${touched.password && errors.password ? 'ion-invalid' : ''}`}
                    >
                      <IonLabel position="stacked">كلمة المرور</IonLabel>
                      <IonInput
                        name="password"
                        type="password"
                        value={values.password}
                        onIonChange={handleChange}
                        onIonBlur={handleBlur}
                      />
                    </IonItem>
                    {touched.password && errors.password && (
                      <IonText color="danger" className="field-error">
                        <small>{errors.password}</small>
                      </IonText>
                    )}

                    <div className="register-actions ion-text-center ion-padding-top">
                      <IonButton type="submit" expand="block" disabled={!isValid || !dirty}>
                        إنشاء حساب
                      </IonButton>
                      <IonText
                        className="ion-padding-top"
                        style={{ display: 'block', marginTop: '16px' }}
                      >
                        <span>لديك حساب بالفعل؟ </span>
                        <IonRouterLink routerLink={`/${LOGIN_URL}`} color="primary">
                          تسجيل الدخول
                        </IonRouterLink>
                      </IonText>
                    </div>
                  </form>
                )}
              </Formik>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Register;
