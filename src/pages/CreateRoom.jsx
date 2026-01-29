import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.jsx";
import { useRoomStore } from "../store/roomStore.js";
import { emitCreateRoom } from "../ws/events.js";

const scoringModes = [
  { id: "fastest-correct", label: "Fastest Correct" },
  { id: "fastest-submit", label: "Fastest Submit" },
  { id: "host-picks", label: "Host Picks Winner" },
];

const scorePositions = [
  { id: 1, label: "1st (10 pts)" },
  { id: 2, label: "2nd (5 pts)" },
  { id: 3, label: "3rd (3 pts)" },
];

export default function CreateRoom() {
  const navigate = useNavigate();
  const { initSocket, playerId, playerName, setPlayerName, roomId, roomState } =
    useRoomStore();
  const [roomName, setRoomName] = useState("");
  const [hostName, setHostName] = useState(playerName || "");
  const [rounds, setRounds] = useState(3);
  const [questionsPerRound, setQuestionsPerRound] = useState(5);
  const [scoringMode, setScoringMode] = useState("fastest-correct");
  const [scoringPositions, setScoringPositions] = useState([1, 2, 3]);
  const [lockAfterSubmit, setLockAfterSubmit] = useState(false);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    if (roomId && roomState?.status === "lobby") {
      navigate(`/room/${roomId}/lobby`);
    }
  }, [roomId, roomState, navigate]);

  const handleCreate = (event) => {
    event.preventDefault();
    if (!hostName.trim()) return;
    setPlayerName(hostName.trim());
    emitCreateRoom({
      playerId,
      hostName: hostName.trim(),
      roomName: roomName.trim(),
      settings: {
        rounds: Number(rounds) || 1,
        questionsPerRound: Number(questionsPerRound) || 1,
        scoringMode,
        scoringPositions,
        lockAfterSubmit,
      },
    });
  };

  const handlePositionToggle = (position) => {
    if (position === 1) return;
    setScoringPositions((prev) => {
      const next = new Set(prev);
      if (next.has(position)) {
        next.delete(position);
      } else {
        next.add(position);
      }
      next.add(1);
      return Array.from(next).sort((a, b) => a - b);
    });
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Room</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleCreate}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Room name (optional)</Label>
              <Input
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                placeholder="Night Shift Trivia"
              />
            </div>
            <div className="space-y-2">
              <Label>Host display name</Label>
              <Input
                value={hostName}
                onChange={(event) => setHostName(event.target.value)}
                placeholder="Alex"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Rounds</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={rounds}
                onChange={(event) => setRounds(event.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label>Questions per round</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={questionsPerRound}
                onChange={(event) =>
                  setQuestionsPerRound(event.target.value.replace(/\D/g, ""))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Scoring mode</Label>
            <Tabs value={scoringMode} onValueChange={setScoringMode}>
              <TabsList className="w-full gap-2">
                {scoringModes.map((mode) => (
                  <TabsTrigger
                    key={mode.id}
                    value={mode.id}
                    className="w-full md:w-auto md:flex-1"
                  >
                    {mode.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {scoringModes.map((mode) => (
                <TabsContent key={mode.id} value={mode.id}>
                  <p className="text-sm text-white/60">
                    {mode.id === "fastest-correct" &&
                      "Host marks correct submissions. Points go to the first correct answers."}
                    {mode.id === "fastest-submit" &&
                      "Host sets the correct answer in advance. First correct submissions win."}
                    {mode.id === "host-picks" &&
                      "Host selects the winners after reviewing submissions."}
                  </p>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="space-y-3">
            <Label>Points awarded</Label>
            <div className="grid gap-2 md:grid-cols-3">
              {scorePositions.map((option) => {
                const isFirst = option.id === 1;
                const isOn = scoringPositions.includes(option.id);
                return (
                  <div
                    key={option.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  >
                    <span>{option.label}</span>
                    <button
                      type="button"
                      onClick={() => !isFirst && handlePositionToggle(option.id)}
                      className={`relative h-6 w-11 rounded-full transition ${
                        isOn ? "bg-emerald-400" : "bg-white/10"
                      } ${isFirst ? "cursor-not-allowed opacity-70" : ""}`}
                      aria-pressed={isOn}
                      aria-label={`Toggle ${option.label}`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                          isOn ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="font-medium">Lock after submit</p>
              <p className="text-xs text-white/50">
                Prevent players from editing after submitting.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLockAfterSubmit((prev) => !prev)}
              className={`relative h-7 w-12 rounded-full transition ${
                lockAfterSubmit ? "bg-emerald-400" : "bg-white/10"
              }`}
              aria-pressed={lockAfterSubmit}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  lockAfterSubmit ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <Button type="submit">Create Room</Button>
        </form>
      </CardContent>
    </Card>
  );
}
