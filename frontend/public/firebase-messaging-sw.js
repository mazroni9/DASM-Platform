// Import the Firebase app and messaging libraries using importScripts
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAP0wlpTowy3KAR7TUlD-jlVN_erRbRinA",
  authDomain: "mazad-e.firebaseapp.com",
  projectId: "mazad-e",
  storageBucket: "mazad-e.appspot.com",
  messagingSenderId: "1082078750311",
  appId: "1:1082078750311:web:69fec88b7309958dc856c2",
  measurementId: "G-FYNJNG6B1F",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the Firebase Messaging service
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message: ", payload);

  //customise notification
  const notificationTitle = payload.notification.title;
  
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || "/mazad-logo.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
