"use client";
import { getToken } from "firebase/messaging";
import { useEffect } from "react";
import { getMessagingInstance } from "@/lib/firebase";
import axios from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

const FirebaseMessagingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn) return;

    const requestPermission = async () => {
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
  }, [isLoggedIn]);

  return <>{children}</>;
};

export default FirebaseMessagingProvider;
