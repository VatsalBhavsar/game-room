import { computePointsDelta } from "../shared/scoring.js";
import { createRoomId, createSubmissionId } from "./utils/ids.js";

export const rooms = new Map();
export const socketToPlayer = new Map();
const hostReassignTimeouts = new Map();

function now() {
  return Date.now();
}

function buildQuestions(settings) {
  const questions = [];
  for (let roundIndex = 0; roundIndex < settings.rounds; roundIndex += 1) {
    for (
      let questionIndex = 0;
      questionIndex < settings.questionsPerRound;
      questionIndex += 1
    ) {
      questions.push({
        roundIndex,
        questionIndex,
        prompt: "",
        imageUrl: "",
        correctAnswer: "",
        locked: false,
        submissions: [],
        result: {
          correctSubmissionIds: [],
          winnerSubmissionIds: [],
        },
        confirmed: false,
      });
    }
  }
  return questions;
}

function getQuestionIndex(room) {
  return (
    room.currentRoundIndex * room.settings.questionsPerRound +
    room.currentQuestionIndex
  );
}

function getAbsoluteQuestionIndex(room, roundIndex, questionIndex) {
  return roundIndex * room.settings.questionsPerRound + questionIndex;
}

export function getCurrentQuestion(room) {
  const idx = getQuestionIndex(room);
  return room.questions[idx];
}

export function getQuestionByLocation(room, roundIndex, questionIndex) {
  const idx = getAbsoluteQuestionIndex(room, roundIndex, questionIndex);
  return room.questions[idx];
}

export function createRoom({ playerId, hostName, roomName, settings }) {
  const roomId = createRoomId();
  const createdAt = now();
  const normalizedSettings = {
    ...settings,
    scoringPositions:
      settings?.scoringPositions && settings.scoringPositions.length
        ? settings.scoringPositions
        : [1, 2, 3],
  };
  const room = {
    roomId,
    roomName: roomName || "Game Room",
    hostId: playerId,
    settings: normalizedSettings,
    status: "lobby",
    currentRoundIndex: 0,
    currentQuestionIndex: 0,
    players: [
      {
        id: playerId,
        name: hostName,
        isHost: true,
        isReady: true,
        joinedAt: createdAt,
        connected: true,
      },
    ],
    questions: buildQuestions(normalizedSettings),
    scores: {
      [playerId]: 0,
    },
    createdAt,
    updatedAt: createdAt,
  };
  rooms.set(roomId, room);
  return room;
}

export function joinRoom({ roomId, playerId, name }) {
  const room = rooms.get(roomId);
  if (!room) return null;

  const existing = room.players.find((player) => player.id === playerId);
  if (existing) {
    existing.connected = true;
    existing.name = name || existing.name;
    room.updatedAt = now();
    return room;
  }

  room.players.push({
    id: playerId,
    name,
    isHost: false,
    isReady: false,
    joinedAt: now(),
    connected: true,
  });
  room.scores[playerId] = room.scores[playerId] || 0;
  room.updatedAt = now();
  return room;
}

export function setReady({ roomId, playerId, isReady, name }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  let player = room.players.find((p) => p.id === playerId);
  if (!player && name) {
    joinRoom({ roomId, playerId, name });
    player = room.players.find((p) => p.id === playerId);
  }
  if (!player) return null;
  if (player.isHost) {
    player.isReady = true;
    room.updatedAt = now();
    return room;
  }
  player.isReady = isReady;
  room.updatedAt = now();
  return room;
}

export function startGame({ roomId }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.status = "in_progress";
  room.currentRoundIndex = 0;
  room.currentQuestionIndex = 0;
  room.updatedAt = now();
  return room;
}

export function setPrompt({ roomId, prompt }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const question = getCurrentQuestion(room);
  if (!question) return null;
  if (typeof prompt === "string") {
    question.prompt = prompt;
  }
  room.updatedAt = now();
  return room;
}

export function setQuestionContent({
  roomId,
  roundIndex,
  questionIndex,
  prompt,
  imageUrl,
  correctAnswer,
}) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const question = getQuestionByLocation(room, roundIndex, questionIndex);
  if (!question) return null;
  if (typeof prompt === "string") {
    question.prompt = prompt;
  }
  if (typeof imageUrl === "string") {
    question.imageUrl = imageUrl;
  }
  if (typeof correctAnswer === "string") {
    question.correctAnswer = correctAnswer;
  }
  room.updatedAt = now();
  return room;
}

export function submitAnswer({ roomId, playerId, answer }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.status !== "in_progress") return room;
  const question = getCurrentQuestion(room);
  if (!question || question.locked) return room;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;
  const playerSubmissions = question.submissions.filter(
    (s) => s.playerId === playerId
  );
  if (playerSubmissions.length && room.settings.lockAfterSubmit) {
    return room;
  }
  if (
    room.settings.scoringMode === "fastest-submit" &&
    question.correctAnswer &&
    playerSubmissions.some((s) => s.isCorrect)
  ) {
    return room;
  }
  if (
    room.settings.scoringMode === "fastest-correct" &&
    question.result.correctSubmissionIds.some((submissionId) =>
      playerSubmissions.some((submission) => submission.submissionId === submissionId)
    )
  ) {
    return room;
  }
  if (
    room.settings.scoringMode === "host-picks" &&
    question.result.winnerSubmissionIds.some((submissionId) =>
      playerSubmissions.some((submission) => submission.submissionId === submissionId)
    )
  ) {
    return room;
  }

  const isCorrect =
    room.settings.scoringMode === "fastest-submit" &&
    normalizeAnswer(question.correctAnswer) &&
    normalizeAnswer(answer) === normalizeAnswer(question.correctAnswer);

  const submission = {
    submissionId: createSubmissionId(),
    playerId,
    name: player.name,
    answer,
    isCorrect,
    submittedAt: now(),
    order: question.submissions.length + 1,
  };
  question.submissions.push(submission);
  room.updatedAt = now();
  return room;
}

export function lockSubmissions({ roomId }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const question = getCurrentQuestion(room);
  if (!question) return null;
  question.locked = true;
  room.updatedAt = now();
  return room;
}

export function markCorrect({ roomId, submissionId, isCorrect }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const question = getCurrentQuestion(room);
  if (!question) return null;
  const set = new Set(question.result.correctSubmissionIds);
  if (isCorrect) {
    set.add(submissionId);
  } else {
    set.delete(submissionId);
  }
  question.result.correctSubmissionIds = Array.from(set);
  room.updatedAt = now();
  return room;
}

export function pickWinner({ roomId, submissionId }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const question = getCurrentQuestion(room);
  if (!question) return null;
  const winners = [...question.result.winnerSubmissionIds];
  const existingIndex = winners.indexOf(submissionId);
  if (existingIndex >= 0) {
    winners.splice(existingIndex, 1);
  } else {
    const maxWinners = room.settings.scoringPositions?.length || 1;
    if (winners.length < maxWinners) {
      winners.push(submissionId);
    }
  }
  question.result.winnerSubmissionIds = winners;
  room.updatedAt = now();
  return room;
}

export function confirmResults({ roomId }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const question = getCurrentQuestion(room);
  if (!question || question.confirmed) return room;

  const pointsDelta = computePointsDelta({
    scoringMode: room.settings.scoringMode,
    submissions: question.submissions,
    correctSubmissionIds: question.result.correctSubmissionIds,
    winnerSubmissionIds: question.result.winnerSubmissionIds,
    correctAnswer: question.correctAnswer,
    scoringPositions: room.settings.scoringPositions,
  });

  Object.entries(pointsDelta).forEach(([playerId, delta]) => {
    room.scores[playerId] = (room.scores[playerId] || 0) + delta;
  });

  question.confirmed = true;
  room.updatedAt = now();
  return room;
}

export function setQuestionMeta({ roomId, prompt, imageUrl, correctAnswer }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const question = getCurrentQuestion(room);
  if (!question) return null;
  if (typeof prompt === "string") {
    question.prompt = prompt;
  }
  if (typeof imageUrl === "string") {
    question.imageUrl = imageUrl;
  }
  if (typeof correctAnswer === "string") {
    question.correctAnswer = correctAnswer;
  }
  room.updatedAt = now();
  return room;
}

export function canEditQuestionAt(room, roundIndex, questionIndex) {
  if (!room) return false;
  if (room.status === "finished") return false;
  if (room.status === "lobby") return true;

  const currentIndex = getQuestionIndex(room);
  const targetIndex = getAbsoluteQuestionIndex(room, roundIndex, questionIndex);
  return targetIndex > currentIndex;
}

export function validateQuestionBankForStart(room) {
  if (!room) {
    return { ok: false, message: "Room not found." };
  }

  for (const question of room.questions) {
    const questionLabel = `Round ${question.roundIndex + 1}, Question ${
      question.questionIndex + 1
    }`;

    if (!String(question.prompt || "").trim()) {
      return {
        ok: false,
        message: `${questionLabel} is missing a prompt.`,
      };
    }

    if (
      room.settings.scoringMode === "fastest-submit" &&
      !String(question.correctAnswer || "").trim()
    ) {
      return {
        ok: false,
        message: `${questionLabel} is missing a correct answer.`,
      };
    }
  }

  return { ok: true };
}

export function nextQuestion({ roomId }) {
  const room = rooms.get(roomId);
  if (!room) return null;

  if (room.currentQuestionIndex + 1 < room.settings.questionsPerRound) {
    room.currentQuestionIndex += 1;
  } else if (room.currentRoundIndex + 1 < room.settings.rounds) {
    room.currentRoundIndex += 1;
    room.currentQuestionIndex = 0;
  } else {
    room.status = "finished";
  }
  room.updatedAt = now();
  return room;
}

export function endGame({ roomId }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.status = "finished";
  room.updatedAt = now();
  return room;
}

export function closeRoom({ roomId }) {
  const room = rooms.get(roomId);
  if (!room) return null;
  clearHostReassign(roomId);
  rooms.delete(roomId);
  return room;
}

export function handleDisconnect({ socketId }) {
  const mapping = socketToPlayer.get(socketId);
  if (!mapping) return null;
  const { roomId, playerId } = mapping;
  const room = rooms.get(roomId);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;
  player.connected = false;
  room.updatedAt = now();
  if (room.hostId === playerId) {
    scheduleHostReassign(room);
  }
  return room;
}

export function registerSocket({ socketId, roomId, playerId }) {
  socketToPlayer.set(socketId, { roomId, playerId });
}

export function clearSocket(socketId) {
  socketToPlayer.delete(socketId);
}

export function scheduleHostReassign(room) {
  if (!room) return;
  if (hostReassignTimeouts.has(room.roomId)) return;

  const timeout = setTimeout(() => {
    const latest = rooms.get(room.roomId);
    if (!latest) return;
    const host = latest.players.find((p) => p.id === latest.hostId);
    if (host && host.connected) {
      hostReassignTimeouts.delete(room.roomId);
      return;
    }
    const nextHost = latest.players.find((p) => p.connected);
    if (nextHost) {
      latest.hostId = nextHost.id;
      latest.players.forEach((p) => {
        p.isHost = p.id === nextHost.id;
      });
    }
    latest.updatedAt = now();
    hostReassignTimeouts.delete(room.roomId);
  }, 30000);

  hostReassignTimeouts.set(room.roomId, timeout);
}

export function clearHostReassign(roomId) {
  const timeout = hostReassignTimeouts.get(roomId);
  if (timeout) {
    clearTimeout(timeout);
    hostReassignTimeouts.delete(roomId);
  }
}

function normalizeAnswer(answer) {
  return String(answer || "").trim().toLowerCase();
}
