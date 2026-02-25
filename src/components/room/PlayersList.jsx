import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../ui/badge.jsx";

export default function PlayersList({ players, hostId, currentPlayerId }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
        Players
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {players.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {player.name}
                  {player.id === currentPlayerId ? " (You)" : ""}
                </p>
                <p className="text-xs text-white/50">
                  {player.connected ? "Connected" : "Disconnected"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {player.id === hostId && <Badge>Host</Badge>}
                {player.isReady && <Badge className="bg-emerald-500/20">Ready</Badge>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
