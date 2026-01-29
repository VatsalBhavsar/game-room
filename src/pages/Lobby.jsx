import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button.jsx";
import RoomHeader from "../components/room/RoomHeader.jsx";
import PlayersList from "../components/room/PlayersList.jsx";
import { useRoomStore } from "../store/roomStore.js";
import { emitRejoinRoom, emitSetReady, emitStartGame } from "../ws/events.js";

export default function Lobby() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { initSocket, roomState, playerId, playerName } = useRoomStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    if (!roomState && roomId && playerName) {
      emitRejoinRoom({ roomId, playerId, name: playerName });
    }
  }, [roomState, roomId, playerId, playerName]);

  useEffect(() => {
    if (!roomState) return;
    if (roomState.status === "in_progress") {
      navigate(`/room/${roomState.roomId}/game`);
    }
    if (roomState.status === "finished") {
      navigate(`/room/${roomState.roomId}/results`);
    }
  }, [roomState, navigate]);

  const me = useMemo(() => {
    return roomState?.players.find((p) => p.id === playerId);
  }, [roomState, playerId]);

  useEffect(() => {
    if (roomState && playerId && playerName && !me) {
      emitRejoinRoom({ roomId: roomState.roomId, playerId, name: playerName });
    }
  }, [roomState, playerId, playerName, me]);

  const allReady = useMemo(() => {
    if (!roomState) return false;
    return roomState.players
      .filter((player) => !player.isHost && player.connected)
      .every((player) => player.isReady);
  }, [roomState]);

  if (!roomState) {
    return (
      <div className="text-white/70">
        Waiting for room data...
      </div>
    );
  }

  const isHost = roomState.hostId === playerId;

  return (
    <div className="flex flex-col gap-8">
      <RoomHeader roomName={roomState.roomName} roomId={roomState.roomId} />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <PlayersList players={roomState.players} hostId={roomState.hostId} />
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">Lobby Controls</h3>
          {!isHost && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">Ready status</p>
              <Button
                type="button"
                variant={me?.isReady ? "primary" : "secondary"}
                disabled={!me}
                onClick={() =>
                  emitSetReady({
                    roomId: roomState.roomId,
                    playerId,
                    name: playerName,
                    isReady: !me?.isReady,
                  })
                }
              >
                {me?.isReady ? "Ready" : "Mark As Ready"}
              </Button>
            </div>
          )}
          {isHost && (
            <p className="text-sm text-white/60">
              Waiting for everyone to ready up.
            </p>
          )}
          {isHost && (
            <Button
              type="button"
              className="w-full"
              disabled={!allReady}
              onClick={() => emitStartGame({ roomId: roomState.roomId, playerId })}
            >
              {allReady ? "Start Game" : "Waiting for ready"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
