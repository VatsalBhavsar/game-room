import { Badge } from "../ui/badge.jsx";
import ShareRoomLink from "./ShareRoomLink.jsx";

export default function RoomHeader({ roomName, roomId }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Room</p>
        <h2 className="text-2xl font-semibold">{roomName}</h2>
        <div className="mt-2 flex items-center gap-2">
          <Badge>Code {roomId}</Badge>
        </div>
      </div>
      <div className="w-full max-w-md">
        <ShareRoomLink roomId={roomId} />
      </div>
    </div>
  );
}
