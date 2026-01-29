import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Button } from "../components/ui/button.jsx";
import WinnerCard from "../components/room/WinnerCard.jsx";
import Scoreboard from "../components/room/Scoreboard.jsx";
import { useRoomStore } from "../store/roomStore.js";
import { getLeaderboard } from "../lib/scoringView.js";
import { emitCreateRoom } from "../ws/events.js";

export default function Results() {
  const navigate = useNavigate();
  const {
    initSocket,
    roomState,
    playerId,
    playerName,
    clearRoom,
    roomId,
  } = useRoomStore();
  const exportRef = useRef(null);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    if (!roomState && roomId) {
      navigate(`/room/${roomId}/lobby`);
    }
  }, [roomState, roomId, navigate]);

  useEffect(() => {
    if (roomState?.status === "lobby") {
      navigate(`/room/${roomState.roomId}/lobby`);
    }
  }, [roomState, navigate]);

  const leaderboard = useMemo(() => getLeaderboard(roomState), [roomState]);
  const winner = leaderboard[0];
  const runnerUp = leaderboard[1];
  const thirdPlace = leaderboard[2];

  if (!roomState) {
    return <div className="text-white/70">Gathering results...</div>;
  }

  const handlePlayAgain = () => {
    emitCreateRoom({
      playerId,
      hostName: playerName || "Host",
      roomName: roomState.roomName,
      settings: roomState.settings,
    });
  };

  const handleExport = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0b0b10",
      });
      const link = document.createElement("a");
      link.download = `game-room-results-${roomState.roomId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      toast.error("Export failed. Try again.");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div
        ref={exportRef}
        className="flex flex-col gap-8 rounded-3xl bg-slate-950 p-6"
      >
        <WinnerCard winner={winner} />
        <div className="grid gap-4 md:grid-cols-2">
          {runnerUp && (
            <div className="rounded-2xl border border-[#c0c0c0]/40 bg-gradient-to-br from-[#c0c0c0]/30 via-[#e5e7eb]/20 to-[#8c8c8c]/20 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-200/70">
                2nd Place
              </p>
              <p className="mt-2 text-xl font-semibold">{runnerUp.name}</p>
              <p className="text-sm text-slate-100/70">{runnerUp.score} points</p>
            </div>
          )}
          {thirdPlace && (
            <div className="rounded-2xl border border-[#cd7f32]/40 bg-gradient-to-br from-[#cd7f32]/30 via-[#e5a15a]/20 to-[#8b4513]/20 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
                3rd Place
              </p>
              <p className="mt-2 text-xl font-semibold">{thirdPlace.name}</p>
              <p className="text-sm text-amber-100/70">{thirdPlace.score} points</p>
            </div>
          )}
        </div>
        <Scoreboard roomState={roomState} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            clearRoom();
            navigate("/");
          }}
        >
          Start New Game
        </Button>
        <Button type="button" variant="secondary" onClick={handleExport}>
          Export Results
        </Button>
        <Button type="button" onClick={handlePlayAgain}>
          Play Again (Same Settings)
        </Button>
      </div>
    </div>
  );
}
