import React from 'react';
import { createRoot } from 'react-dom/client';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import moment from 'moment';
// استيراد locale العربي - المسار الصحيح في Vite
import 'moment/dist/locale/ar';
import App from './App';

// ضبط اللغة العربية لـ Moment.js على مستوى التطبيق
// يجب التأكد من أن الـ locale تم تحميله قبل استخدام moment في أي مكان
moment.locale('ar');

// تسجيل عناصر PWA (مطلوب لعمل Camera API في المتصفح)
defineCustomElements(window);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
