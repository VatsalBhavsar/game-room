const PLAYER_ID_KEY = "game-room-player-id";
const PLAYER_NAME_KEY = "game-room-player-name";

export function getOrCreatePlayerId() {
  const existing = localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;
  const generated =
    (crypto && crypto.randomUUID && crypto.randomUUID()) ||
    `player_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(PLAYER_ID_KEY, generated);
  return generated;
}

export function getStoredPlayerName() {
  return localStorage.getItem(PLAYER_NAME_KEY) || "";
}

export function setStoredPlayerName(name) {
  if (name) {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  }
}
