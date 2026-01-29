import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";

export default function QuestionPanel({
  question,
  isHost,
  scoringMode,
  onSetPrompt,
}) {
  const [draft, setDraft] = useState(question?.prompt || "");
  const [imageUrl, setImageUrl] = useState(question?.imageUrl || "");
  const [correctAnswer, setCorrectAnswer] = useState(
    question?.correctAnswer || ""
  );
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    setDraft(question?.prompt || "");
    setImageUrl(question?.imageUrl || "");
    setCorrectAnswer(question?.correctAnswer || "");
  }, [
    question?.roundIndex,
    question?.questionIndex,
    question?.prompt,
    question?.imageUrl,
    question?.correctAnswer,
  ]);

  useEffect(() => {
    if (!savedAt) return;
    const timeout = setTimeout(() => setSavedAt(null), 1500);
    return () => clearTimeout(timeout);
  }, [savedAt]);

  if (!question) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-white/60">Waiting for the first question.</p>
      </div>
    );
  }

  const handleSave = () => {
    if (typeof onSetPrompt === "function") {
      onSetPrompt({
        prompt: draft,
        imageUrl,
        correctAnswer,
      });
      setSavedAt(Date.now());
      toast.success("Prompt updated.");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Question Prompt</h3>
        {question.locked && (
          <span className="text-xs uppercase tracking-[0.2em] text-rose-300">
            Locked
          </span>
        )}
      </div>
      {isHost ? (
        <div className="space-y-3">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type or paste the prompt..."
          />
          <Input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Image URL (optional)"
          />
          {scoringMode === "fastest-submit" && (
            <Input
              value={correctAnswer}
              onChange={(event) => setCorrectAnswer(event.target.value)}
              placeholder="Correct answer (required for fastest submit)"
            />
          )}
          <Button type="button" variant="secondary" onClick={handleSave}>
            Update Prompt
          </Button>
          {savedAt && (
            <p className="text-xs text-emerald-200/80">
              Updated just now.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <motion.p
            key={question.prompt}
            initial={{ opacity: 0.4, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-semibold text-white"
          >
            {question.prompt || "No prompt yet. Hang tight."}
          </motion.p>
          {question.imageUrl && (
            <motion.div
              key={question.imageUrl}
              initial={{ opacity: 0.4, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
            >
              <img
                src={question.imageUrl}
                alt="Prompt visual"
                className="max-h-64 w-full object-contain"
              />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
