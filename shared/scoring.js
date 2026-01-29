/**
 * @param {Object} params
 * @param {"fastest-correct" | "fastest-submit" | "host-picks"} params.scoringMode
 * @param {Array} params.submissions
 * @param {string[]} params.correctSubmissionIds
 * @param {string[]} params.winnerSubmissionIds
 * @param {string} params.correctAnswer
 * @param {number[]} params.scoringPositions
 * @returns {Record<string, number>}
 */
export function computePointsDelta({
  scoringMode,
  submissions = [],
  correctSubmissionIds = [],
  winnerSubmissionIds = [],
  correctAnswer = "",
  scoringPositions = [1, 2, 3],
}) {
  const points = {};
  const awards = buildAwards(scoringPositions);

  if (scoringMode === "fastest-correct") {
    const correctSet = new Set(correctSubmissionIds);
    const ranked = submissions.filter((s) => correctSet.has(s.submissionId));
    ranked.slice(0, awards.length).forEach((submission, index) => {
      points[submission.playerId] =
        (points[submission.playerId] || 0) + awards[index];
    });
  }

  if (scoringMode === "fastest-submit") {
    const normalizedAnswer = normalizeAnswer(correctAnswer);
    if (normalizedAnswer) {
      const correctSubmissions = submissions.filter(
        (submission) =>
          normalizeAnswer(submission.answer) === normalizedAnswer
      );
      correctSubmissions.slice(0, awards.length).forEach((submission, index) => {
        points[submission.playerId] =
          (points[submission.playerId] || 0) + awards[index];
      });
    }
  }

  if (scoringMode === "host-picks" && winnerSubmissionIds.length) {
    winnerSubmissionIds.slice(0, awards.length).forEach((id, index) => {
      const winner = submissions.find(
        (submission) => submission.submissionId === id
      );
      if (winner) {
        points[winner.playerId] = (points[winner.playerId] || 0) + awards[index];
      }
    });
  }

  return points;
}

function buildAwards(scoringPositions) {
  const pointsByRank = {
    1: 10,
    2: 5,
    3: 3,
  };
  const ranks = Array.from(new Set(scoringPositions))
    .filter((rank) => pointsByRank[rank])
    .sort((a, b) => a - b);
  return ranks.map((rank) => pointsByRank[rank]);
}

function normalizeAnswer(answer) {
  return String(answer || "").trim().toLowerCase();
}
