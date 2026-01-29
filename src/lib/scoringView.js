export function getLeaderboard(roomState) {
  if (!roomState) return [];
  return roomState.players
    .map((player) => ({
      ...player,
      score: roomState.scores[player.id] || 0,
    }))
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
}

export function getCurrentQuestion(roomState) {
  if (!roomState) return null;
  const idx =
    roomState.currentRoundIndex * roomState.settings.questionsPerRound +
    roomState.currentQuestionIndex;
  return roomState.questions[idx];
}
