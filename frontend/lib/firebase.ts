import { initializeApp, getApps } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAP0wlpTowy3KAR7TUlD-jlVN_erRbRinA",
  authDomain: "mazad-e.firebaseapp.com",
  projectId: "mazad-e",
  storageBucket: "mazad-e.appspot.com",
  messagingSenderId: "1082078750311",
  appId: "1:1082078750311:web:69fec88b7309958dc856c2",
  measurementId: "G-FYNJNG6B1F"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const getMessagingInstance = () => {
  if (typeof window !== 'undefined' && app) {
    return getMessaging(app);
  }
  return null;
};

export { getMessagingInstance };
