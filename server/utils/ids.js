import { nanoid } from "nanoid";

export function createRoomId() {
  return nanoid(6).toUpperCase();
}

export function createSubmissionId() {
  return nanoid(10);
}
