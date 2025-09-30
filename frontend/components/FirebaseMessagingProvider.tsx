"use client";
import { getToken, onMessage } from "firebase/messaging";
import { useEffect, useState, useRef } from "react";
import { getMessagingInstance } from "../lib/firebase";
import axios from "../lib/axios";
import NotificationSnackbar from "./ui/NotificationSnackbar";
import { useNotification } from "@/context/NotificationContext";
import { useAuthStore } from "@/store/authStore";

const FirebaseMessagingProvider = ({ children }) => {
  const [NotificationPayload, setNotificationPayload] = useState({
    title: "",
    body: "",
    link:"/"
  });
  const [ViewNotification, setViewNotification] = useState(false);
  const [deviceTokenRegistered, setDeviceTokenRegistered] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const audioRef = useRef(null);
  const { isLoggedIn, user, initialized } = useAuthStore();


  // Wait for auth store to be initialized before enabling Firebase messaging
  useEffect(() => {
    if (initialized !== undefined) {
      // Add a small delay to ensure auth store is fully ready
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [initialized]);

  const handleCloseNotification = () => {
    setViewNotification(false);
  };
  const {dispatch} = useNotification();

  // Watch for authentication changes and register device token when user logs in
  useEffect(() => {
    // Don't run until we're ready AND user is authenticated
    if (!isReady || !isLoggedIn) {
      return;
    }

    const registerDeviceToken = async () => {
      
      // Only proceed if user is authenticated and we haven't registered the token yet
      if (isLoggedIn && user && !deviceTokenRegistered) {
        try {
          const messaging = getMessagingInstance();
          if (messaging) {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              const token = await getToken(messaging, {
                vapidKey:
                  "BITf0Omz9PHJyczXIHtApsjwLy_rVhCH3qZnHCrZyeu83SwRfcAQ0ntzYgUsWc0dOrezaz5zeWR8per80c6JK_s",
              });
              if (token) {
                console.log("FCM Token:", token);
                try {
                  // Double-check that we're still authenticated before making the API call
                  if (isLoggedIn && user) {
                    await axios.post("/api/device-tokens", { token });
                    setDeviceTokenRegistered(true);
                    console.log("Device token registered successfully after authentication");
                  } else {
                    console.log("User no longer authenticated, skipping device token registration");
                  }
                } catch (error) {
                  console.error("Failed to register device token:", error);
                }
              }
            }
          }
        } catch (error) {
          console.error("An error occurred while registering device token:", error);
        }
      } else if (!isLoggedIn) {
        // Reset device token registration state when user logs out
        setDeviceTokenRegistered(false);
      }
    };

    registerDeviceToken();
  }, [isReady, initialized, isLoggedIn, user, deviceTokenRegistered]);

  useEffect(() => {
    // Don't run until we're ready AND user is authenticated
    if (!isReady || !isLoggedIn) {
      return;
    }

    const messaging = getMessagingInstance();
    const audio = new Audio("/sounds/default.mp3");

    //audio.muted = true;
    audioRef.current = audio;

    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);

    let unsubscribeOnMessage;
    if (messaging) {
      console.log("Messaging instance found");

      unsubscribeOnMessage = onMessage(messaging, (payload) => {
        console.log("Foreground message received: ", payload);
        if (audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.error("Error playing notification sound:", error);
          });
        }
        window.addEventListener("click", unlockAudio);
       
        setNotificationPayload({
          title: payload.notification.title,
          body: payload.notification.body,
          link:payload.fcmOptions?.link || '/'
        });
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            id:payload.messageId,
            title: payload.notification.title,
            body: payload.notification.body,
            created_at: Date.now(),
            action: {route_name: payload.fcmOptions?.link || '/'}
          },
        });
        setViewNotification(true);
      });
    }

    // Device token registration is now handled in the separate useEffect above

    return () => {
      window.removeEventListener("click", unlockAudio);
      if (unsubscribeOnMessage) {
        unsubscribeOnMessage();
      }
    };
  }, [isReady, isLoggedIn]);

  return (
    <>
      <NotificationSnackbar
        title={NotificationPayload.title}
        body={NotificationPayload.body}
        link={NotificationPayload.link}
        ViewNotification={ViewNotification}
        onClose={handleCloseNotification}
      />
      {children}
    </>
  );
};

export default FirebaseMessagingProvider;
