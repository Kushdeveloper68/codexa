import { useEffect, useRef } from "react";
import { socket } from "../socket/socketClient";
import { getTeacherToken } from "../utils/localSession";

/**
 * Connects the shared socket, joins the given room (as teacher or student),
 * and disconnects on unmount. Returns the socket instance via ref so
 * callers can add/remove listeners without re-triggering this effect.
 *
 * When asTeacher is true, the stored teacher token is sent explicitly in
 * the join payload rather than relying on the socket handshake picking up
 * an httpOnly cookie automatically — cross-site cookies (frontend and
 * backend on different domains) are unreliable across browsers, so this
 * is what actually works once deployed. See localSession.js.
 */
export function useRoomSocket({ roomCode, studentSessionId, asTeacher, onJoined, onError }) {
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!roomCode) return;

    if (!socket.connected) socket.connect();

    const doJoin = () => {
      const teacherToken = asTeacher ? getTeacherToken(roomCode) : undefined;
      socket.emit(
        "room:join",
        { roomCode, studentSessionId, asTeacher, teacherToken },
        (res) => {
          if (res?.error) {
            onError?.(res.error);
          } else {
            joinedRef.current = true;
            onJoined?.(res);
          }
        }
      );
    };

    if (socket.connected) doJoin();
    socket.on("connect", doJoin);

    return () => {
      socket.off("connect", doJoin);
      // Keep the underlying socket alive across page navigations within
      // the app, just stop listening for this room's join ack.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, studentSessionId, asTeacher]);

  return socket;
}
