import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { IonLoading } from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import api from '../config/axios';
import { PROFILE_URL, API_URL } from '../config/urls';
import { AuthContext, type UserProfile } from './auth.types';

// إعادة التصدير حتى لا تتأثر باقي الملفات التي تستورد من هنا
export { AuthContext, type UserProfile, type AuthContextType } from './auth.types';

interface AuthContextProviderProps {
  children: ReactNode;
}

const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [jwt, setJwt] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  // بناء رابط صورة الملف الشخصي الكامل
  const getProfileImageUrl = useCallback((imageUrl?: string | null): string => {
    if (!imageUrl) return '';
    // إذا كان الرابط كاملًا (يبدأ بـ http) نرجعه مباشرة
    if (imageUrl.startsWith('http')) return imageUrl;
    // وإلا نضيف عنوان السيرفر
    return `${API_URL}${imageUrl}`;
  }, []);

  // جلب بيانات المستخدم من السيرفر
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get(PROFILE_URL);
      setUser(res.data.user);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, []);

  useEffect(() => {
    getAuthenticated();
  }, []);

  const getAuthenticated = async () => {
    try {
      const { value } = await Preferences.get({ key: 'accessToken' });
      if (value) {
        setLoggedIn(true);
        setJwt(value);
        // جلب بيانات المستخدم بعد التحقق من وجود Token
        try {
          const res = await api.get(PROFILE_URL);
          setUser(res.data.user);
        } catch {
          // Token غير صالح - تنظيف البيانات
          await Preferences.remove({ key: 'accessToken' });
          setLoggedIn(false);
          setJwt(null);
          setUser(null);
        }
      } else {
        setLoggedIn(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setLoggedIn(false);
    } finally {
      setShowLoading(false);
    }
  };

  const logout = async () => {
    try {
      await Preferences.remove({ key: 'accessToken' });
      setLoggedIn(false);
      setJwt(null);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (showLoading) {
    return <IonLoading isOpen={showLoading} message="جار التحميل..." />;
  }

  return (
    <AuthContext.Provider
      value={{
        loggedIn,
        setLoggedIn,
        jwt,
        setJwt,
        user,
        setUser,
        logout,
        fetchProfile,
        getProfileImageUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
