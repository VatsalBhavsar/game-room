import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import QuestionPanel from "../components/room/QuestionPanel.jsx";
import SubmissionsPanel from "../components/room/SubmissionsPanel.jsx";
import Scoreboard from "../components/room/Scoreboard.jsx";
import { useRoomStore } from "../store/roomStore.js";
import { getCurrentQuestion } from "../lib/scoringView.js";
import {
  emitConfirmResults,
  emitEndGame,
  emitLockSubmissions,
  emitMarkCorrect,
  emitNextQuestion,
  emitPickWinner,
  emitSetPrompt,
  emitSubmitAnswer,
  emitRejoinRoom,
} from "../ws/events.js";

export default function Game() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { initSocket, roomState, playerId, playerName } = useRoomStore();
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    if (!roomState && roomId && playerName) {
      emitRejoinRoom({ roomId, playerId, name: playerName });
    }
  }, [roomState, roomId, playerId, playerName]);

  useEffect(() => {
    if (roomState?.status === "finished") {
      navigate(`/room/${roomState.roomId}/results`);
    }
    if (roomState?.status === "lobby") {
      navigate(`/room/${roomState.roomId}/lobby`);
    }
  }, [roomState, navigate]);

  const question = useMemo(() => getCurrentQuestion(roomState), [roomState]);
  useEffect(() => {
    setAnswer("");
  }, [question?.questionIndex, question?.roundIndex]);

  if (!roomState || !question) {
    return <div className="text-white/70">Loading game...</div>;
  }

  const isHost = roomState.hostId === playerId;
  const me = roomState.players.find((player) => player.id === playerId);
  const mySubmissions = question.submissions.filter((s) => s.playerId === playerId);
  const hasCorrectSubmission = mySubmissions.some((s) => s.isCorrect);
  const hasHostMarkedCorrect = mySubmissions.some((submission) =>
    question.result.correctSubmissionIds.includes(submission.submissionId)
  );
  const hasBeenPickedWinner = mySubmissions.some((submission) =>
    question.result.winnerSubmissionIds.includes(submission.submissionId)
  );
  const hasPrompt = Boolean(String(question.prompt || "").trim());
  const canSubmit =
    hasPrompt &&
    !question.locked &&
    (!roomState.settings.lockAfterSubmit || mySubmissions.length === 0) &&
    !(
      roomState.settings.scoringMode === "fastest-correct" && hasHostMarkedCorrect
    ) &&
    !(
      roomState.settings.scoringMode === "host-picks" && hasBeenPickedWinner
    ) &&
    !(
      roomState.settings.scoringMode === "fastest-submit" && hasCorrectSubmission
    );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!answer.trim()) return;
    emitSubmitAnswer({ roomId: roomState.roomId, playerId, answer: answer.trim() });
    setAnswer("");
  };

  const renderSubmissionForm = () => (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold">Your submission</h3>
      {roomState.settings.lockAfterSubmit && mySubmissions.length > 0 ? (
        <div className="text-sm text-white/70">
          Submitted #{mySubmissions[0].order}: {mySubmissions[0].answer}
        </div>
      ) : (
        <>
          {mySubmissions.length > 0 && (
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-white/70">
              {mySubmissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className="flex items-center justify-between"
                >
                  <span>
                    #{submission.order} {submission.answer}
                  </span>
                  <span className="text-white/40">
                    {new Date(submission.submittedAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={hasPrompt ? "Type your answer" : "Waiting for host prompt..."}
            disabled={!canSubmit}
          />
          <Button type="submit" disabled={!canSubmit}>
            {hasHostMarkedCorrect &&
            roomState.settings.scoringMode === "fastest-correct"
              ? "Marked Correct"
              : hasBeenPickedWinner &&
                roomState.settings.scoringMode === "host-picks"
              ? "Picked Winner"
              : hasCorrectSubmission &&
                roomState.settings.scoringMode === "fastest-submit"
              ? "Correct! Locked"
              : "Submit Answer"}
          </Button>
        </>
      )}
    </form>
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-6 overflow-hidden">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Room</p>
          <h2 className="text-2xl font-semibold">{roomState.roomName}</h2>
        </div>
        <div className="text-sm text-white/60">
          Round {roomState.currentRoundIndex + 1} / {roomState.settings.rounds} -
          Question {roomState.currentQuestionIndex + 1} /{" "}
          {roomState.settings.questionsPerRound}
        </div>
        <div className="flex flex-col text-right text-sm text-white/70">
          <span className="font-mono">Code {roomState.roomId}</span>
          {me?.name && <span>You: {me.name}</span>}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="flex min-h-0 flex-col gap-6">
          <QuestionPanel
            question={question}
            isHost={isHost}
            scoringMode={roomState.settings.scoringMode}
            onSetPrompt={({ prompt, imageUrl, correctAnswer }) =>
              emitSetPrompt({
                roomId: roomState.roomId,
                playerId,
                prompt,
                imageUrl,
                correctAnswer,
              })
            }
          />

          <SubmissionsPanel
            className="flex-1"
            scoringMode={roomState.settings.scoringMode}
            submissions={question.submissions}
            correctSubmissionIds={question.result.correctSubmissionIds}
            winnerSubmissionIds={question.result.winnerSubmissionIds}
            isHost={isHost}
            currentPlayerId={playerId}
            confirmed={question.confirmed}
            onMarkCorrect={(submissionId, isCorrect) =>
              emitMarkCorrect({
                roomId: roomState.roomId,
                playerId,
                submissionId,
                isCorrect,
              })
            }
            onPickWinner={(submissionId) =>
              emitPickWinner({ roomId: roomState.roomId, playerId, submissionId })
            }
            onConfirm={() => emitConfirmResults({ roomId: roomState.roomId, playerId })}
          />
        </div>
        <div className="flex min-h-0 flex-col gap-6">
          {isHost ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold">Host Controls</h3>
              <Button
                type="button"
                variant="secondary"
                onClick={() => emitLockSubmissions({ roomId: roomState.roomId, playerId })}
              >
                Lock Submissions
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!question.confirmed}
                onClick={() => emitNextQuestion({ roomId: roomState.roomId, playerId })}
              >
                Next Question
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => emitEndGame({ roomId: roomState.roomId, playerId })}
              >
                End Game
              </Button>
            </div>
          ) : (
            renderSubmissionForm()
          )}
          <Scoreboard roomState={roomState} />
        </div>
      </div>
    </div>
  );
}
