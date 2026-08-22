import { useEffect, useRef } from "react";
import { socket } from "../socket/socketClient";

/**
 * Connects the shared socket, joins the given room (as teacher or student),
 * and disconnects on unmount. Returns the socket instance via ref so
 * callers can add/remove listeners without re-triggering this effect.
 */
export function useRoomSocket({ roomCode, studentSessionId, asTeacher, onJoined, onError }) {
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!roomCode) return;

    if (!socket.connected) socket.connect();

    const doJoin = () => {
      socket.emit(
        "room:join",
        { roomCode, studentSessionId, asTeacher },
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
