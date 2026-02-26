import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.jsx";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";
import { Badge } from "../ui/badge.jsx";
import { emitSetQuestionContent } from "../../ws/events.js";
import { X } from "lucide-react";

function makeKey(roundIndex, questionIndex) {
  return `${roundIndex}-${questionIndex}`;
}

export default function QuestionBankDialog({
  open,
  onOpenChange,
  roomState,
  playerId,
}) {
  const [drafts, setDrafts] = useState({});

  const questions = roomState?.questions || [];
  const isHost = roomState?.hostId === playerId;
  const totalQuestions = questions.length;
  const currentAbsoluteIndex =
    roomState &&
    roomState.currentRoundIndex * roomState.settings.questionsPerRound +
      roomState.currentQuestionIndex;

  useEffect(() => {
    if (!open || !roomState) return;
    const nextDrafts = {};
    for (const question of roomState.questions) {
      const key = makeKey(question.roundIndex, question.questionIndex);
      nextDrafts[key] = {
        prompt: question.prompt || "",
        imageUrl: question.imageUrl || "",
        correctAnswer: question.correctAnswer || "",
      };
    }
    setDrafts(nextDrafts);
  }, [open, roomState?.roomId]);

  const readyCount = useMemo(() => {
    if (!roomState) return 0;
    return roomState.questions.filter((question) => {
      const key = makeKey(question.roundIndex, question.questionIndex);
      const draft = drafts[key] || {
        prompt: question.prompt || "",
        imageUrl: question.imageUrl || "",
        correctAnswer: question.correctAnswer || "",
      };
      const hasPrompt = Boolean(String(draft.prompt || "").trim());
      if (roomState.settings.scoringMode === "fastest-submit") {
        return hasPrompt && Boolean(String(draft.correctAnswer || "").trim());
      }
      return hasPrompt;
    }).length;
  }, [roomState, drafts]);

  if (!roomState) return null;

  const handleDraftChange = (question, field, value) => {
    const key = makeKey(question.roundIndex, question.questionIndex);
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {
          prompt: question.prompt || "",
          imageUrl: question.imageUrl || "",
          correctAnswer: question.correctAnswer || "",
        }),
        [field]: value,
      },
    }));
  };

  const canEditQuestion = (question) => {
    if (!isHost || roomState.status === "finished") return false;
    if (roomState.status === "lobby") return true;
    const absoluteIndex =
      question.roundIndex * roomState.settings.questionsPerRound +
      question.questionIndex;
    return absoluteIndex > currentAbsoluteIndex;
  };

  const getQuestionStateLabel = (question) => {
    if (roomState.status !== "in_progress") return "Pending";
    const absoluteIndex =
      question.roundIndex * roomState.settings.questionsPerRound +
      question.questionIndex;
    if (absoluteIndex < currentAbsoluteIndex) return "Done";
    if (absoluteIndex === currentAbsoluteIndex) return "Current";
    return "Upcoming";
  };

  const saveQuestion = (question) => {
    if (!canEditQuestion(question)) return;
    const key = makeKey(question.roundIndex, question.questionIndex);
    const draft = drafts[key] || {
      prompt: question.prompt || "",
      imageUrl: question.imageUrl || "",
      correctAnswer: question.correctAnswer || "",
    };
    emitSetQuestionContent({
      roomId: roomState.roomId,
      playerId,
      roundIndex: question.roundIndex,
      questionIndex: question.questionIndex,
      prompt: draft.prompt,
      imageUrl: draft.imageUrl,
      correctAnswer: draft.correctAnswer,
    });
    toast.success(
      `Saved Round ${question.roundIndex + 1}, Question ${
        question.questionIndex + 1
      }`
    );
  };

  const saveAllQuestions = () => {
    const editableQuestions = questions.filter((question) => canEditQuestion(question));
    if (editableQuestions.length === 0) {
      toast.info("No editable questions to save.");
      return;
    }

    editableQuestions.forEach((question) => {
      const key = makeKey(question.roundIndex, question.questionIndex);
      const draft = drafts[key] || {
        prompt: question.prompt || "",
        imageUrl: question.imageUrl || "",
        correctAnswer: question.correctAnswer || "",
      };
      emitSetQuestionContent({
        roomId: roomState.roomId,
        playerId,
        roundIndex: question.roundIndex,
        questionIndex: question.questionIndex,
        prompt: draft.prompt,
        imageUrl: draft.imageUrl,
        correctAnswer: draft.correctAnswer,
      });
    });

    toast.success(`Saved ${editableQuestions.length} question(s).`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-5xl flex-col overflow-hidden">
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-4 top-4 rounded-lg p-2 text-white/70 transition hover:bg-white/10"
            aria-label="Close question bank"
          >
            <X size={16} />
          </button>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>Question Bank</DialogTitle>
          <DialogDescription>
            Ready {readyCount}/{totalQuestions}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {questions.map((question) => {
            const key = makeKey(question.roundIndex, question.questionIndex);
            const draft = drafts[key] || {
              prompt: question.prompt || "",
              imageUrl: question.imageUrl || "",
              correctAnswer: question.correctAnswer || "",
            };
            const editable = canEditQuestion(question);
            const stateLabel = getQuestionStateLabel(question);

            return (
              <div
                key={key}
                className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    Round {question.roundIndex + 1} - Question{" "}
                    {question.questionIndex + 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge>{stateLabel}</Badge>
                    {!editable && <Badge className="bg-white/10">Locked</Badge>}
                  </div>
                </div>

                <Input
                  value={draft.prompt}
                  onChange={(event) =>
                    handleDraftChange(question, "prompt", event.target.value)
                  }
                  placeholder="Prompt"
                  disabled={!editable}
                />
                <Input
                  value={draft.imageUrl}
                  onChange={(event) =>
                    handleDraftChange(question, "imageUrl", event.target.value)
                  }
                  placeholder="Image URL (optional)"
                  disabled={!editable}
                />
                {roomState.settings.scoringMode === "fastest-submit" && (
                  <Input
                    value={draft.correctAnswer}
                    onChange={(event) =>
                      handleDraftChange(question, "correctAnswer", event.target.value)
                    }
                    placeholder="Correct answer"
                    disabled={!editable}
                  />
                )}
                {editable && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => saveQuestion(question)}
                  >
                    Save Question
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end border-t border-white/10 pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={!isHost || readyCount !== totalQuestions}
            onClick={saveAllQuestions}
          >
            Save All ({readyCount}/{totalQuestions})
          </Button>
          <DialogClose asChild>
            <Button type="button" className="ml-2">
              Done
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
