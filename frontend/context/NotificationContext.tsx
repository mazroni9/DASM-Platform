"use client";
import api from "@/lib/axios";
import { useContext, createContext, useEffect, useReducer } from "react";
import { useAuthStore } from "@/store/authStore";

const notificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  dispatch: (action: any) => {},
});

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  function reducer(state, action) {
    switch (action.type) {
      case "SET_NOTIFICATIONS":
        return {
          notifications: action.payload.notifications,
          unreadCount: action.payload.unreadCount,
        };
      case "ADD_NOTIFICATION":
        return {
          ...state,
          notifications: [action.payload, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reducer, {
    notifications: [],
    unreadCount: 0,
  });

  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/api/notifications");
        const responseData = await response.data;

        dispatch({
          type: "SET_NOTIFICATIONS",
          payload: {
            notifications: responseData.data.notifications,
            unreadCount: responseData.data.unreadNotificationsCount,
          },
        });
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    if (isLoggedIn) {
      fetchNotifications();
    }
  }, [isLoggedIn]);

  return (
    <notificationContext.Provider value={{ ...state, dispatch }}>
      {children}
    </notificationContext.Provider>
  );
}

export const useNotification = () => {
  return useContext(notificationContext);
};
