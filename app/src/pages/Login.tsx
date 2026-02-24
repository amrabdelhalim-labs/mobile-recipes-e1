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
import { logInOutline } from 'ionicons/icons';
import { Formik, type FormikHelpers } from 'formik';
import * as yup from 'yup';
import { useContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router';
import { AxiosError } from 'axios';
import { Preferences } from '@capacitor/preferences';
import Header from '../components/Header/Header';
import api from '../config/axios';
import { LOGIN_URL, REGISTER_URL } from '../config/urls';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

interface LoginFormValues {
  email: string;
  password: string;
}

const initialValues: LoginFormValues = {
  email: '',
  password: '',
};

// مطابق لقواعد التحقق في السيرفر: email required + valid, password required
const validationSchema = yup.object<LoginFormValues>({
  email: yup
    .string()
    .required('يجب عليك إدخال البريد الإلكتروني')
    .email('يجب عليك إدخال بريد إلكتروني صحيح'),
  password: yup.string().required('يجب عليك إدخال كلمة المرور'),
});

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState(false);

  const { setLoggedIn, setJwt, jwt, loggedIn, fetchProfile } = useContext(AuthContext);
  const history = useHistory();

  // التحقق التلقائي: إذا كان المستخدم مسجل الدخول بالفعل يُوجّه للرئيسية
  useEffect(() => {
    if (loggedIn && jwt) {
      history.replace('/tabs/home');
    }
  }, [loggedIn, jwt, history]);

  const handleLogin = async (
    values: LoginFormValues,
    { resetForm }: FormikHelpers<LoginFormValues>
  ) => {
    setLoading(true);
    try {
      const res = await api.post(LOGIN_URL, values);

      // السيرفر يرجع { token } - نخزنه مع البادئة Bearer
      const token = `Bearer ${res.data.token}`;

      await Preferences.set({
        key: 'accessToken',
        value: token,
      });

      setLoggedIn(true);
      setJwt(token);

      // جلب بيانات المستخدم بعد تسجيل الدخول
      await fetchProfile();

      resetForm();
      history.push('/tabs/home');
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 400) {
        setErrorAlert(true);
      } else {
        console.error('Login error:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <Header title="تسجيل الدخول" showMenuButton={false} showBackButton={false} />

      <IonLoading isOpen={loading} message="جارٍ تسجيل الدخول..." />

      <IonAlert
        isOpen={errorAlert}
        onDidDismiss={() => setErrorAlert(false)}
        header="تنبيه!"
        message="البريد الإلكتروني أو كلمة المرور غير صحيح"
        buttons={[{ text: 'موافق', role: 'ok' }]}
      />

      <IonContent>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="6" sizeLg="4">
              <div className="login-hero ion-text-center ion-padding">
                <IonAvatar className="login-avatar">
                  <IonIcon icon={logInOutline} className="login-icon" />
                </IonAvatar>
                <IonText color="primary">
                  <h2>تسجيل الدخول</h2>
                </IonText>
              </div>

              <Formik<LoginFormValues>
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleLogin}
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
                      className={`login-field ${touched.email && errors.email ? 'ion-invalid' : ''}`}
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
                      className={`login-field ${touched.password && errors.password ? 'ion-invalid' : ''}`}
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

                    <div className="login-actions ion-text-center ion-padding-top">
                      <IonButton type="submit" expand="block" disabled={!isValid || !dirty}>
                        تسجيل الدخول
                      </IonButton>
                      <IonText
                        className="ion-padding-top"
                        style={{ display: 'block', marginTop: '16px' }}
                      >
                        <span>ليس لديك حساب؟ </span>
                        <IonRouterLink routerLink={`/${REGISTER_URL}`} color="primary">
                          تسجيل مستخدم جديد
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

export default Login;
