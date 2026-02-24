import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

interface HeaderProps {
  title: string;
  defaultHref?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  defaultHref = '/tabs/home',
  showBackButton = true,
  showMenuButton = true,
}) => {
  return (
    <IonHeader>
      <IonToolbar color="primary">
        {showBackButton && (
          <IonButtons slot="start">
            <IonBackButton defaultHref={defaultHref} text="" />
          </IonButtons>
        )}
        <IonTitle>{title}</IonTitle>
        {showMenuButton && (
          <IonButtons slot="end">
            <IonMenuButton />
          </IonButtons>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

export default Header;
