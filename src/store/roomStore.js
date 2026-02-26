import { create } from "zustand";
import { toast } from "sonner";
import { getOrCreatePlayerId, getStoredPlayerName, setStoredPlayerName } from "../lib/id";
import { setupSocketListeners } from "../ws/events";

let listenersAttached = false;

export const useRoomStore = create((set, get) => ({
  socketConnected: false,
  roomState: null,
  roomId: "",
  roomClosedAt: 0,
  closedRoomId: "",
  lastErrorCode: "",
  lastErrorAt: 0,
  playerId: getOrCreatePlayerId(),
  playerName: getStoredPlayerName(),
  initSocket: () => {
    if (listenersAttached) return;
    setupSocketListeners({
      onConnect: () => set({ socketConnected: true }),
      onDisconnect: () => set({ socketConnected: false }),
      onRoomState: (roomState) =>
        set({
          roomState,
          roomId: roomState.roomId,
          roomClosedAt: 0,
          closedRoomId: "",
          lastErrorCode: "",
          lastErrorAt: 0,
        }),
      onJoined: (roomId, roomState) =>
        set({
          roomId,
          roomState,
          roomClosedAt: 0,
          closedRoomId: "",
          lastErrorCode: "",
          lastErrorAt: 0,
        }),
      onRoomClosed: (closedRoomId) =>
        set({
          roomState: null,
          roomId: "",
          closedRoomId: closedRoomId || "",
          roomClosedAt: Date.now(),
        }),
      onError: (message, code) => {
        set({ lastErrorCode: code || "", lastErrorAt: Date.now() });
        toast.error(message || "Something went wrong");
      },
    });
    listenersAttached = true;
  },
  setPlayerName: (name) => {
    set({ playerName: name });
    setStoredPlayerName(name);
  },
  clearRoom: () =>
    set({
      roomState: null,
      roomId: "",
      roomClosedAt: 0,
      closedRoomId: "",
      lastErrorCode: "",
      lastErrorAt: 0,
    }),
}));
