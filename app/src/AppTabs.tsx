import { Route, Redirect } from 'react-router-dom';
import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { useContext, useEffect, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router';
import { addCircle, home, person, list } from 'ionicons/icons';
import { AuthContext } from './context/AuthContext';
import AllPosts from './pages/AllPosts';
import MyPosts from './pages/MyPosts';
import CreatePost from './pages/CreatePost';
import PostDetailPage from './pages/PostDetail';
import UpdatePost from './pages/UpdatePost';
import Profile from './pages/Profile';

const AppTabs: React.FC = () => {
  const { loggedIn } = useContext(AuthContext);
  const history = useHistory();
  const location = useLocation();

  const isValidTabsPath = useMemo(() => {
    const path = location.pathname;
    if (path === '/tabs') return true;
    return /^\/tabs\/(home|profile|posts\/create|posts\/me|posts\/\d+(\/edit)?)$/.test(path);
  }, [location.pathname]);

  // حماية جميع مسارات /tabs - توجيه للـ login إذا لم يكن مسجل الدخول
  useEffect(() => {
    if (!loggedIn) {
      history.replace('/account/login');
    }
  }, [loggedIn, history, location]);

  // عرض فارغ أثناء التحقق من الحالة
  if (!loggedIn) {
    return null;
  }

  if (!isValidTabsPath) {
    return <Redirect to="/not-found" />;
  }

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/home">
          <AllPosts />
        </Route>
        <Route exact path="/tabs/posts/create">
          <CreatePost />
        </Route>
        <Route exact path="/tabs/posts/me">
          <MyPosts />
        </Route>
        <Route exact path="/tabs/profile">
          <Profile />
        </Route>
        <Route exact path="/tabs/posts/:id(\d+)/edit">
          <UpdatePost />
        </Route>
        <Route exact path="/tabs/posts/:id(\d+)">
          <PostDetailPage />
        </Route>
        <Route exact path="/tabs">
          <Redirect to="/tabs/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/tabs/home">
          <IonIcon icon={home} />
          <IonLabel>الرئيسية</IonLabel>
        </IonTabButton>
        <IonTabButton tab="create" href="/tabs/posts/create">
          <IonIcon icon={addCircle} />
          <IonLabel>إنشاء</IonLabel>
        </IonTabButton>
        <IonTabButton tab="my-posts" href="/tabs/posts/me">
          <IonIcon icon={list} />
          <IonLabel>منشوراتي</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile">
          <IonIcon icon={person} />
          <IonLabel>حسابي</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default AppTabs;
