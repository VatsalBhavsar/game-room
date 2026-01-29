import { motion } from "framer-motion";

export default function WinnerCard({ winner }) {
  if (!winner) return null;

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-3xl border border-[#f5c542]/40 bg-gradient-to-br from-[#f5c542]/30 via-[#ffdd6e]/20 to-[#b8860b]/20 p-8 text-center"
    >
      <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">
        Winner
      </p>
      <h2 className="mt-3 text-3xl font-bold">{winner.name}</h2>
      <p className="mt-2 text-lg text-amber-100/80">{winner.score} points</p>
    </motion.div>
  );
}
