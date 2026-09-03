"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { useMe } from "@/lib/api-client";
import { toast } from "sonner";

/**
 * ReminderService — a component (not a hook) that connects to the Baydin
 * reminder mini-service on port 3003 via the Caddy XTransformPort gateway.
 *
 * Renders nothing — only manages the socket connection side-effects.
 * Listens for: goal_reminder, daily_reward, ritual_reminder events.
 */
export function ReminderService() {
  const { data } = useMe();
  const user = data?.user;

  React.useEffect(() => {
    if (!user) return;

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const socket: Socket = io("/?XTransformPort=3003", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      socket.emit("register", user.id);
    });

    socket.on("reminder", (data: {
      type: "goal_reminder" | "daily_reward" | "ritual_reminder";
      title?: string;
      message: string;
      timestamp: string;
    }) => {
      const icon = data.type === "goal_reminder" ? "🎯" : data.type === "daily_reward" ? "✦" : "🔥";
      toast(data.title || "Baydin Reminder", {
        description: `${icon} ${data.message}`,
        duration: 10000,
      });

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Baydin ✦", {
          body: `${icon} ${data.message}`,
          icon: "/favicon.svg",
          tag: data.type,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return null;
}
