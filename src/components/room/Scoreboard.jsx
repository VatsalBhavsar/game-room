import { motion, AnimatePresence } from "framer-motion";
import { getLeaderboard } from "../../lib/scoringView.js";

export default function Scoreboard({ roomState }) {
  const leaderboard = getLeaderboard(roomState);
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
        Leaderboard
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {leaderboard.map((player, index) => {
            const medalClass =
              index === 0
                ? "bg-gradient-to-r from-[#f5c542]/30 via-[#ffdd6e]/20 to-[#b8860b]/20 border-[#f5c542]/40"
                : index === 1
                ? "bg-gradient-to-r from-[#c0c0c0]/30 via-[#e5e7eb]/20 to-[#8c8c8c]/20 border-[#c0c0c0]/40"
                : index === 2
                ? "bg-gradient-to-r from-[#cd7f32]/30 via-[#e5a15a]/20 to-[#8b4513]/20 border-[#cd7f32]/40"
                : "bg-white/5 border-white/10";
            return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${medalClass}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/50">#{index + 1}</span>
                <p className="font-medium">{player.name}</p>
              </div>
              <span className="text-lg font-semibold">{player.score}</span>
            </motion.div>
          );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
