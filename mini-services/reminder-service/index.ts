import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

/**
 * Baydin Reminder Service (Socket.io) — port 3003
 *
 * Polls the database every 30 seconds for active Goals whose reminderTime
 * matches the current HH:mm. When a match is found, emits a "reminder"
 * event to the connected device's socket.
 *
 * Also supports real-time notifications for:
 * - Goal reminder times
 * - Daily Luck reward availability
 * - Ritual step reminders
 *
 * Frontend connects via: io("/?XTransformPort=3003", { transports: ["websocket"] })
 */

const PORT = 3003;
const db = new PrismaClient();

const httpServer = createServer();
const io = new Server(httpServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Map of socketId → userId for targeted reminders
const socketUserMap = new Map<string, string>();

io.on("connection", (socket) => {
  console.log(`[reminder-service] Socket connected: ${socket.id}`);

  socket.on("register", (userId: string) => {
    if (userId) {
      socketUserMap.set(socket.id, userId);
      console.log(`[reminder-service] Registered user ${userId} on socket ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    socketUserMap.delete(socket.id);
    console.log(`[reminder-service] Socket disconnected: ${socket.id}`);
  });
});

// Check for goal reminders every 30 seconds
async function checkGoalReminders() {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  try {
    const goals = await db.goal.findMany({
      where: {
        status: "active",
        reminderTime: currentTime,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        intention: true,
        reminderTime: true,
      },
    });

    for (const goal of goals) {
      // Check if already confirmed today
      const today = now.toISOString().slice(0, 10);
      const confirmed = await db.confirmation.findUnique({
        where: { goalId_date: { goalId: goal.id, date: today } },
      });

      if (!confirmed) {
        // Find the socket for this user
        for (const [socketId, userId] of socketUserMap.entries()) {
          if (userId === goal.userId) {
            io.to(socketId).emit("reminder", {
              type: "goal_reminder",
              goalId: goal.id,
              title: goal.title,
              intention: goal.intention,
              message: `Time to confirm your intention: ${goal.title}`,
              timestamp: now.toISOString(),
            });
            console.log(`[reminder-service] Sent reminder to ${userId} for goal "${goal.title}"`);
          }
        }
      }
    }
  } catch (err) {
    console.error("[reminder-service] Error checking goal reminders:", err);
  }
}

// Check for daily reward availability (every hour at :01)
async function checkDailyReward() {
  const now = new Date();
  if (now.getMinutes() !== 1) return;

  const today = now.toISOString().slice(0, 10);
  try {
    const users = await db.user.findMany({
      where: { dailyRewards: { none: { date: today } } },
      select: { id: true },
    });

    for (const user of users) {
      for (const [socketId, userId] of socketUserMap.entries()) {
        if (userId === user.id) {
          io.to(socketId).emit("reminder", {
            type: "daily_reward",
            message: "Your daily Luck is ready to claim!",
            timestamp: now.toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.error("[reminder-service] Error checking daily rewards:", err);
  }
}

// Check for ritual reminders (every hour at :30)
async function checkRitualReminders() {
  const now = new Date();
  if (now.getMinutes() !== 30) return;

  const today = now.toISOString().slice(0, 10);
  try {
    const incompleteRituals = await db.ritualLog.findMany({
      where: { date: today, completed: false },
      select: { userId: true },
    });

    for (const ritual of incompleteRituals) {
      for (const [socketId, userId] of socketUserMap.entries()) {
        if (userId === ritual.userId) {
          io.to(socketId).emit("reminder", {
            type: "ritual_reminder",
            message: "Your daily ritual is incomplete — finish it for +3 Luck bonus!",
            timestamp: now.toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.error("[reminder-service] Error checking ritual reminders:", err);
  }
}

// Run checks every 30 seconds
setInterval(async () => {
  await checkGoalReminders();
  await checkDailyReward();
  await checkRitualReminders();
}, 30000);

// Initial check on startup
setTimeout(async () => {
  await checkGoalReminders();
  await checkDailyReward();
  await checkRitualReminders();
}, 5000);

httpServer.listen(PORT, () => {
  console.log(`[reminder-service] Baydin Reminder Service running on port ${PORT}`);
  console.log(`[reminder-service] Frontend connects via: io("/?XTransformPort=${PORT}")`);
  console.log(`[reminder-service] Polling for reminders every 30 seconds...`);
});
