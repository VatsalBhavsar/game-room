import { connectSocket, getSocket } from "./socket";

export function setupSocketListeners({
  onConnect,
  onDisconnect,
  onRoomState,
  onError,
  onJoined,
  onRoomClosed,
}) {
  const socket = connectSocket();
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("ROOM_STATE", ({ roomState }) => onRoomState(roomState));
  socket.on("ROOM_CREATED", ({ roomId, roomState }) => onJoined(roomId, roomState));
  socket.on("JOINED", ({ roomId, roomState }) => onJoined(roomId, roomState));
  socket.on("ROOM_CLOSED", ({ roomId }) => onRoomClosed?.(roomId));
  socket.on("ERROR", ({ message, code }) => onError(message, code));
  return socket;
}

export function emitCreateRoom(payload) {
  getSocket().emit("CREATE_ROOM", payload);
}

export function emitJoinRoom(payload) {
  getSocket().emit("JOIN_ROOM", payload);
}

export function emitRejoinRoom(payload) {
  getSocket().emit("REJOIN_ROOM", payload);
}

export function emitSetReady(payload) {
  getSocket().emit("SET_READY", payload);
}

export function emitStartGame(payload) {
  getSocket().emit("START_GAME", payload);
}

export function emitSetPrompt(payload) {
  getSocket().emit("SET_PROMPT", payload);
}

export function emitSetQuestionContent(payload) {
  getSocket().emit("SET_QUESTION_CONTENT", payload);
}

export function emitSubmitAnswer(payload) {
  getSocket().emit("SUBMIT_ANSWER", payload);
}

export function emitLockSubmissions(payload) {
  getSocket().emit("LOCK_SUBMISSIONS", payload);
}

export function emitMarkCorrect(payload) {
  getSocket().emit("MARK_CORRECT", payload);
}

export function emitPickWinner(payload) {
  getSocket().emit("PICK_WINNER", payload);
}

export function emitConfirmResults(payload) {
  getSocket().emit("CONFIRM_RESULTS", payload);
}

export function emitNextQuestion(payload) {
  getSocket().emit("NEXT_QUESTION", payload);
}

export function emitEndGame(payload) {
  getSocket().emit("END_GAME", payload);
}

export function emitCloseRoom(payload, onAck) {
  getSocket().emit("CLOSE_ROOM", payload, onAck);
}
