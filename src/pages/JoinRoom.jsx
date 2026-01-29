import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import { useRoomStore } from "../store/roomStore.js";
import { emitJoinRoom } from "../ws/events.js";

export default function JoinRoom() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { initSocket, playerId, playerName, setPlayerName, roomId, roomState } =
    useRoomStore();
  const [roomCode, setRoomCode] = useState(params.get("roomId") || "");
  const [name, setName] = useState(playerName || "");

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    if (roomId && roomState) {
      navigate(`/room/${roomId}/lobby`);
    }
  }, [roomId, roomState, navigate]);

  const handleJoin = (event) => {
    event.preventDefault();
    if (!roomCode.trim() || !name.trim()) return;
    setPlayerName(name.trim());
    emitJoinRoom({ roomId: roomCode.trim().toUpperCase(), playerId, name: name.trim() });
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Join Room</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleJoin}>
          <div className="space-y-2">
            <Label>Room code</Label>
            <Input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              placeholder="ABC123"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Sam"
              required
            />
          </div>
          <Button type="submit">Join Room</Button>
        </form>
      </CardContent>
    </Card>
  );
}
