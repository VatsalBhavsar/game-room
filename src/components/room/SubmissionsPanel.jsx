import { Button } from "../ui/button.jsx";
import { Badge } from "../ui/badge.jsx";

export default function SubmissionsPanel({
  scoringMode,
  submissions = [],
  correctSubmissionIds = [],
  winnerSubmissionIds = [],
  isHost,
  currentPlayerId,
  confirmed,
  onMarkCorrect,
  onPickWinner,
  onConfirm,
  className = "",
}) {
  const orderedSubmissions = [...submissions].sort((a, b) => b.order - a.order);

  return (
    <div
      className={`flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Submissions</h3>
        <Badge>{submissions.length}</Badge>
      </div>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {submissions.length === 0 && (
          <p className="text-sm text-white/50">No submissions yet.</p>
        )}
        {orderedSubmissions.map((submission) => {
          const isCorrect = correctSubmissionIds.includes(submission.submissionId);
          const winnerIndex = winnerSubmissionIds.indexOf(submission.submissionId);
          const isWinner = winnerIndex >= 0;
          return (
            <div
              key={submission.submissionId}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    #{submission.order} {submission.name}
                  </p>
                  <span className="text-xs text-white/40">
                    {new Date(submission.submittedAt).toLocaleTimeString()}
                  </span>
                  {submission.isCorrect &&
                    scoringMode === "fastest-submit" &&
                    (isHost || submission.playerId === currentPlayerId) && (
                    <Badge className="bg-emerald-500/20 text-emerald-100">
                      Correct
                    </Badge>
                    )}
                  {isWinner && scoringMode === "host-picks" && (
                    <Badge className="bg-amber-400/20 text-amber-100">
                      {winnerIndex === 0 ? "1st" : winnerIndex === 1 ? "2nd" : "3rd"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-white/70">{submission.answer}</p>
              </div>
              {isHost && scoringMode === "fastest-correct" && (
                <Button
                  type="button"
                  variant={isCorrect ? "primary" : "secondary"}
                  size="sm"
                  disabled={confirmed}
                  onClick={() => onMarkCorrect(submission.submissionId, !isCorrect)}
                >
                  {isCorrect ? "Correct" : "Mark Correct"}
                </Button>
              )}
              {isHost && scoringMode === "host-picks" && (
                <Button
                  type="button"
                  variant={isWinner ? "primary" : "secondary"}
                  size="sm"
                  disabled={confirmed}
                  onClick={() => onPickWinner(submission.submissionId)}
                >
                  {isWinner ? "Picked" : "Pick Place"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {isHost && (
        <Button
          type="button"
          onClick={onConfirm}
          disabled={confirmed || submissions.length === 0}
          className="mt-4"
        >
          {confirmed ? "Results Confirmed" : "Confirm Results"}
        </Button>
      )}
    </div>
  );
}
