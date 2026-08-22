import { customAlphabet } from "nanoid";

// Excludes 0/O, 1/I/L and other visually-confusable characters so the code
// can be read out loud in a lab or written on a whiteboard without ambiguity.
const SAFE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const length = Number(process.env.ROOM_CODE_LENGTH) || 5;

const generate = customAlphabet(SAFE_ALPHABET, length);

export function generateRoomCode() {
  return generate();
}
