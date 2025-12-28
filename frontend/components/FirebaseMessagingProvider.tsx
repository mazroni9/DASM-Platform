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
    link: "/",
  });
  const [ViewNotification, setViewNotification] = useState(false);
  const audioRef = useRef(null);

  const handleCloseNotification = () => {
    setViewNotification(false);
  };
  const { dispatch } = useNotification();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn) return;

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
          link: payload.fcmOptions?.link || "/",
        });
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            id: payload.messageId,
            title: payload.notification.title,
            body: payload.notification.body,
            created_at: Date.now(),
            action: { route_name: payload.fcmOptions?.link || "/" },
          },
        });
        setViewNotification(true);
      });
    }

    const requestPermission = async () => {
      try {
        if (messaging) {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const token = await getToken(messaging, {
              vapidKey:
                "BITf0Omz9PHJyczXIHtApsjwLy_rVhCH3qZnHCrZyeu83SwRfcAQ0ntzYgUsWc0dOrezaz5zeWR8per80c6JK_s",
            });
            if (token) {
              console.log("FCM Token:", token);
              // Send token to your server
              await axios.post("/api/device-tokens", { token });
            } else {
              console.log(
                "No registration token available. Request permission to generate one."
              );
            }
          }
        }
      } catch (error) {
        console.error("An error occurred while retrieving token:", error);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener("click", unlockAudio);
      if (unsubscribeOnMessage) {
        unsubscribeOnMessage();
      }
    };
  }, [isLoggedIn]);

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
