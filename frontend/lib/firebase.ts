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

/**
 * Returns Firebase Messaging instance or null if unsupported (e.g. Safari, iOS).
 * Never throws — Firebase Messaging is not supported in Safari and can crash the app.
 */
const getMessagingInstance = (): ReturnType<typeof getMessaging> | null => {
  if (typeof window === 'undefined' || !app) return null;
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
};

export { app, getMessagingInstance };
