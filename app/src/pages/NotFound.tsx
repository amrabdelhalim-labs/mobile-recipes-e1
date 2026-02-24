import { IonButton, IonContent, IonIcon, IonPage, IonText } from '@ionic/react';
import { sadOutline } from 'ionicons/icons';
import './NotFound.css';

const NotFound: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        <div className="not-found-container">
          <IonIcon icon={sadOutline} className="not-found-icon" />
          <IonText>
            <h1>404</h1>
            <h2>الصفحة غير موجودة</h2>
            <p>عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
          </IonText>
          <IonButton routerLink="/tabs/home" expand="block" className="ion-margin-top">
            العودة للرئيسية
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotFound;
