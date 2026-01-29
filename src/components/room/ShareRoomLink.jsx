import { useMemo } from "react";
import { Copy } from "lucide-react";
import { Input } from "../ui/input.jsx";

export default function ShareRoomLink({ roomId }) {
  const shareUrl = useMemo(() => {
    if (!roomId) return "";
    return `${window.location.origin}/join?roomId=${roomId}`;
  }, [roomId]);

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      window.alert("Copy failed. You can manually copy the link.");
    }
  };

  return (
    <div className="relative">
      <Input
        readOnly
        value={shareUrl}
        className="pr-12 font-mono text-xs"
      />
      <button
        type="button"
        onClick={copyLink}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/70 transition hover:bg-white/10"
        aria-label="Copy link"
      >
        <Copy size={16} />
      </button>
    </div>
  );
}
