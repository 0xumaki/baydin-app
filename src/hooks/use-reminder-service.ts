"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { useMe } from "@/lib/api-client";
import { toast } from "sonner";

/**
 * useReminderService — connects to the Baydin reminder mini-service on port 3003
 * via the Caddy XTransformPort gateway. Listens for:
 * - goal_reminder: time to confirm a daily intention
 * - daily_reward: daily Luck is available to claim
 * - ritual_reminder: daily ritual not yet completed
 *
 * Shows a toast notification + browser notification (if permission granted).
 */
export function useReminderService() {
  const { data } = useMe();
  const user = data?.user;
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    if (!user) return;

    // Request notification permission
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Connect to the reminder service
    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register", user.id);
    });

    socket.on("reminder", (data: {
      type: "goal_reminder" | "daily_reward" | "ritual_reminder";
      title?: string;
      message: string;
      timestamp: string;
    }) => {
      // Show toast
      const icon = data.type === "goal_reminder" ? "🎯" : data.type === "daily_reward" ? "✦" : "🔥";
      toast(data.title || "Baydin Reminder", {
        description: `${icon} ${data.message}`,
        duration: 10000,
      });

      // Show browser notification if permitted
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Baydin ✦", {
          body: `${icon} ${data.message}`,
          icon: "/favicon.svg",
          tag: data.type,
        });
      }
    });

    socket.on("disconnect", () => {
      // Silent — will auto-reconnect
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  return null;
}
