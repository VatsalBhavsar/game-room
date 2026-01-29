import {
  clearHostReassign,
  clearSocket,
  confirmResults,
  createRoom,
  endGame,
  getCurrentQuestion,
  handleDisconnect,
  joinRoom,
  lockSubmissions,
  markCorrect,
  nextQuestion,
  pickWinner,
  registerSocket,
  rooms,
  setQuestionMeta,
  setReady,
  startGame,
  submitAnswer,
  socketToPlayer,
} from "./roomStore.js";

async function emitRoomState(io, room) {
  if (!room) return;
  const sockets = await io.in(room.roomId).fetchSockets();
  sockets.forEach((socket) => {
    const mapping = socketToPlayer.get(socket.id);
    const includeAnswers = mapping?.playerId === room.hostId;
    socket.emit("ROOM_STATE", {
      roomState: sanitizeRoomState(room, includeAnswers),
    });
  });
}

function sendError(socket, message, code = "BAD_REQUEST") {
  socket.emit("ERROR", { message, code });
}

export function registerHandlers(io, socket) {
  socket.on("CREATE_ROOM", (payload) => {
    const { playerId, hostName, roomName, settings } = payload || {};
    if (!playerId || !hostName || !settings) {
      sendError(socket, "Missing room details.");
      return;
    }
    const room = createRoom({ playerId, hostName, roomName, settings });
    registerSocket({ socketId: socket.id, roomId: room.roomId, playerId });
    socket.join(room.roomId);
    socket.emit("ROOM_CREATED", {
      roomId: room.roomId,
      roomState: sanitizeRoomState(room, true),
    });
    emitRoomState(io, room);
  });

  socket.on("JOIN_ROOM", (payload) => {
    const { roomId, playerId, name } = payload || {};
    if (!roomId || !playerId || !name) {
      sendError(socket, "Missing join details.");
      return;
    }
    const room = joinRoom({ roomId, playerId, name });
    if (!room) {
      sendError(socket, "Room not found.", "ROOM_NOT_FOUND");
      return;
    }
    if (room.hostId === playerId) {
      clearHostReassign(roomId);
    }
    registerSocket({ socketId: socket.id, roomId, playerId });
    socket.join(roomId);
    socket.emit("JOINED", {
      roomId,
      roomState: sanitizeRoomState(room, room.hostId === playerId),
    });
    emitRoomState(io, room);
  });

  socket.on("REJOIN_ROOM", (payload) => {
    const { roomId, playerId, name } = payload || {};
    if (!roomId || !playerId) {
      sendError(socket, "Missing rejoin details.");
      return;
    }
    const room = joinRoom({ roomId, playerId, name });
    if (!room) {
      sendError(socket, "Room not found.", "ROOM_NOT_FOUND");
      return;
    }
    clearHostReassign(roomId);
    registerSocket({ socketId: socket.id, roomId, playerId });
    socket.join(roomId);
    socket.emit("JOINED", {
      roomId,
      roomState: sanitizeRoomState(room, room.hostId === playerId),
    });
    emitRoomState(io, room);
  });

  socket.on("SET_READY", (payload) => {
    const { roomId, playerId, isReady, name } = payload || {};
    const room = setReady({ roomId, playerId, isReady, name });
    if (!room) {
      sendError(socket, "Unable to update ready state.");
      return;
    }
    emitRoomState(io, room);
  });

  socket.on("START_GAME", (payload) => {
    const { roomId, playerId } = payload || {};
    const room = rooms.get(roomId);
    if (!room || room.hostId !== playerId) {
      sendError(socket, "Only the host can start the game.");
      return;
    }
    const notReady = room.players.filter(
      (player) => !player.isHost && player.connected && !player.isReady
    );
    if (notReady.length > 0) {
      sendError(socket, "All players must be ready before starting.");
      return;
    }
    emitRoomState(io, startGame({ roomId }));
  });

  socket.on("SET_PROMPT", (payload) => {
    const { roomId, playerId, prompt, imageUrl, correctAnswer } = payload || {};
    const room = rooms.get(roomId);
    if (!room || room.hostId !== playerId) {
      sendError(socket, "Only the host can edit prompts.");
      return;
    }
    emitRoomState(
      io,
      setQuestionMeta({ roomId, prompt, imageUrl, correctAnswer })
    );
  });

  socket.on("SUBMIT_ANSWER", (payload) => {
    const { roomId, playerId, answer } = payload || {};
    if (!roomId || !playerId) {
      sendError(socket, "Missing submission.");
      return;
    }
    emitRoomState(io, submitAnswer({ roomId, playerId, answer }));
  });

  socket.on("LOCK_SUBMISSIONS", (payload) => {
    const { roomId, playerId } = payload || {};
    const room = rooms.get(roomId);
    if (!room || room.hostId !== playerId) {
      sendError(socket, "Only the host can lock.");
      return;
    }
    emitRoomState(io, lockSubmissions({ roomId }));
  });

  socket.on("MARK_CORRECT", (payload) => {
    const { roomId, playerId, submissionId, isCorrect } = payload || {};
    const room = rooms.get(roomId);
    if (!room || room.hostId !== playerId) {
      sendError(socket, "Only the host can mark.");
      return;
    }
    if (room.settings.scoringMode !== "fastest-correct") {
      sendError(socket, "Scoring mode does not allow marking.");
      return;
    }
    emitRoomState(io, markCorrect({ roomId, submissionId, isCorrect }));
  });

  socket.on("PICK_WINNER", (payload) => {
    const { roomId, playerId, submissionId } = payload || {};
    const room = rooms.get(roomId);
    if (!room || room.hostId !== playerId) {
      sendError(socket, "Only the host can pick.");
      return;
    }
    if (room.settings.scoringMode !== "host-picks") {
      sendError(socket, "Scoring mode does not allow picking.");
      return;
    }
    emitRoomState(io, pickWinner({ roomId, submissionId }));
  });

  socket.on("CONFIRM_RESULTS", (payload) => {
    const { roomId, playerId } = payload || {};
    const room = rooms.get(roomId);
    if (!room || room.hostId !== playerId) {
      sendError(socket, "Only the host can confirm results.");
      return;
    }
    const question = getCurrentQuestion(room);
    if (
      room.settings.scoringMode === "fastest-submit" &&
      !question?.correctAnswer
    ) {
      sendError(socket, "Set the correct answer before confirming results.");
      return;
    }
    emitRoomState(io, confirmResults({ roomId }));
  });

  socket.on("NEXT_QUESTION", (payload) => {
    const { roomId, playerId } = payload || {};
    const room = rooms.get(roomId);
    if (!room || room.hostId !== playerId) {
      sendError(socket, "Only the host can advance.");
      return;
    }
    const current = getCurrentQuestion(room);
    if (current && !current.confirmed) {
      sendError(socket, "Confirm results before advancing.");
      return;
    }
    emitRoomState(io, nextQuestion({ roomId }));
  });

  socket.on("END_GAME", (payload) => {
    const { roomId, playerId } = payload || {};
    const room = rooms.get(roomId);
    if (!room || room.hostId !== playerId) {
      sendError(socket, "Only the host can end the game.");
      return;
    }
    emitRoomState(io, endGame({ roomId }));
  });

  socket.on("disconnect", () => {
    const room = handleDisconnect({ socketId: socket.id });
    clearSocket(socket.id);
    if (room) {
      emitRoomState(io, room);
    }
  });
}

function sanitizeRoomState(room, includeAnswers) {
  const safeRoom =
    typeof structuredClone === "function"
      ? structuredClone(room)
      : JSON.parse(JSON.stringify(room));
  if (!includeAnswers) {
    safeRoom.questions = safeRoom.questions.map((question) => ({
      ...question,
      correctAnswer: "",
    }));
  }
  return safeRoom;
}
