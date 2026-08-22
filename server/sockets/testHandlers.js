import StudentSession from "../models/StudentSession.js";

/**
 * Test-room-specific real-time events. Anti-cheat *events* themselves go
 * through the REST endpoint (POST /api/test/:code/activity) so they're
 * durably persisted and validated the same way regardless of transport;
 * this file only covers presence/heartbeat, which is cheap and frequent.
 */
export function registerTestHandlers(io, socket) {
  socket.on("session:heartbeat", async () => {
    const { studentSessionId } = socket.data;
    if (!studentSessionId) return;
    try {
      await StudentSession.updateOne(
        { sessionId: studentSessionId },
        { $set: { lastHeartbeatAt: new Date() } }
      );
    } catch (err) {
      console.error("heartbeat update error", err);
    }
  });
}
