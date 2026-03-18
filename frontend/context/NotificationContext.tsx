"use client";
import api from "@/lib/axios";
import {
  useContext,
  createContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import { useAuthStore } from "@/store/authStore";

interface NotificationContextType {
  notifications: any[];
  unreadCount: number;
  dispatch: (action: any) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const notificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  dispatch: (action: any) => {},
  markAsRead: async (id: string) => {},
  markAllAsRead: async () => {},
  refreshNotifications: async () => {},
});

interface NotificationState {
  notifications: any[];
  unreadCount: number;
}

type NotificationAction =
  | {
      type: "SET_NOTIFICATIONS";
      payload: { notifications: any[]; unreadCount: number };
    }
  | { type: "ADD_NOTIFICATION"; payload: any }
  | { type: "MARK_AS_READ"; payload: { id: string } }
  | { type: "MARK_ALL_AS_READ" };

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  function reducer(
    state: NotificationState,
    action: NotificationAction
  ): NotificationState {
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
      case "MARK_AS_READ":
        return {
          ...state,
          notifications: state.notifications.map((n) =>
            n.id === action.payload.id
              ? { ...n, read_at: new Date().toISOString() }
              : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      case "MARK_ALL_AS_READ":
        return {
          ...state,
          notifications: state.notifications.map((n) => ({
            ...n,
            read_at: n.read_at || new Date().toISOString(),
          })),
          unreadCount: 0,
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

  const fetchNotifications = useCallback(async () => {
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
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      dispatch({ type: "MARK_AS_READ", payload: { id } });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post("/api/notifications/mark-all-read");
      dispatch({ type: "MARK_ALL_AS_READ" });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
    }
  }, [isLoggedIn, fetchNotifications]);

  return (
    <notificationContext.Provider
      value={{
        ...state,
        dispatch,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </notificationContext.Provider>
  );
}

export const useNotification = () => {
  return useContext(notificationContext);
};
