import {
  IonContent,
  IonHeader,
  IonMenu,
  IonTitle,
  IonList,
  IonItem,
  IonToolbar,
  IonLabel,
  IonIcon,
  IonAvatar,
  IonImg,
  IonText,
  IonMenuToggle,
  IonToggle,
} from '@ionic/react';
import {
  personCircleOutline,
  clipboardOutline,
  logOutOutline,
  moonOutline,
  sunnyOutline,
} from 'ionicons/icons';
import { useState, useEffect, useContext, useMemo } from 'react';
import { useHistory } from 'react-router';
import { AuthContext } from '../../context/AuthContext';
import { LOGIN_URL } from '../../config/urls';
import { Preferences } from '@capacitor/preferences';
import './Menu.css';

const Menu: React.FC = () => {
  const [side, setSide] = useState<'start' | 'end'>('end');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  const { logout, user, getProfileImageUrl } = useContext(AuthContext);
  const history = useHistory();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 992px)');

    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setSide('end');
      } else {
        setSide('start');
      }
    };

    handleMediaChange(mediaQuery);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  // تحميل وضع المظهر (من التخزين أو من إعدادات النظام)
  useEffect(() => {
    const themeKey = 'theme';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const loadTheme = async () => {
      const { value } = await Preferences.get({ key: themeKey });
      if (value === 'dark' || value === 'light') {
        setIsDarkMode(value === 'dark');
      } else {
        setIsDarkMode(systemPrefersDark.matches);
      }
      setThemeLoaded(true);
    };

    const handleSystemThemeChange = async (e: MediaQueryListEvent) => {
      const { value } = await Preferences.get({ key: themeKey });
      if (!value) {
        setIsDarkMode(e.matches);
      }
    };

    loadTheme();
    systemPrefersDark.addEventListener('change', handleSystemThemeChange);
    return () => systemPrefersDark.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // تطبيق المظهر على مستوى التطبيق
  useEffect(() => {
    if (!themeLoaded) return;
    document.documentElement.classList.toggle('ion-palette-dark', isDarkMode);
    Preferences.set({ key: 'theme', value: isDarkMode ? 'dark' : 'light' });
  }, [isDarkMode, themeLoaded]);

  const handleLogout = async () => {
    await logout();
    history.push(`/${LOGIN_URL}`);
  };

  const themeLabel = useMemo(() => (isDarkMode ? 'الوضع الداكن' : 'الوضع الفاتح'), [isDarkMode]);

  return (
    <IonMenu side={side} contentId="menu">
      <IonHeader>
        <IonToolbar>
          <IonTitle className="ion-text-center">القائمة</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonAvatar className="menu-avatar">
          <IonImg src={getProfileImageUrl(user?.ImageUrl)} alt="صورة المستخدم" />
        </IonAvatar>
        <div className="ion-text-center ion-margin-top">
          <IonText color="primary">
            <h3>{user?.name ?? 'مستخدم'}</h3>
          </IonText>
        </div>
        <IonList>
          <IonItem lines="none">
            <IonIcon color="primary" icon={isDarkMode ? moonOutline : sunnyOutline} slot="start" />
            <IonLabel>{themeLabel}</IonLabel>
            <IonToggle
              slot="end"
              checked={isDarkMode}
              onIonChange={(e) => setIsDarkMode(e.detail.checked)}
            />
          </IonItem>
          <IonMenuToggle autoHide={true}>
            <IonItem routerLink="/tabs/profile" routerDirection="root" button>
              <IonIcon color="primary" icon={personCircleOutline} slot="start" />
              <IonLabel>البيانات الشخصية</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle autoHide={true}>
            <IonItem routerLink="/tabs/posts/me" routerDirection="root" button>
              <IonIcon color="primary" icon={clipboardOutline} slot="start" />
              <IonLabel>منشوراتي</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle autoHide={true}>
            <IonItem onClick={handleLogout} button>
              <IonIcon color="primary" icon={logOutOutline} slot="start" />
              <IonLabel>تسجيل الخروج</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
