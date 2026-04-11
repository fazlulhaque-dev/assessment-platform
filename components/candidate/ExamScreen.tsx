"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useAppDispatch } from "@/store/hooks";
import { startSession } from "@/store/slices/examSessionSlice";
import { useExamTimer } from "@/hooks/useExamTimer";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";
import { useExamSession } from "@/hooks/useExamSession";
import { Exam, Question, BehavioralEventType } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, Send, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import QuestionRenderer from "./QuestionRenderer";
import OfflineBanner from "@/components/shared/OfflineBanner";

interface ExamScreenProps {
  examId: string;
}

export default function ExamScreen({ examId }: ExamScreenProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [violations, setViolations] = useState<
    { type: BehavioralEventType; time: Date }[]
  >([]);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [lastViolation, setLastViolation] =
    useState<BehavioralEventType | null>(null);

  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    answeredCount,
    answers,
    isSubmitted,
    saveAnswer,
    navigateTo,
    submitExam,
    syncPendingAnswers,
  } = useExamSession(allQuestions);

  // Auto-submit on time expire
  const handleExpire = useCallback(async () => {
    toast.warning("Time's up! Submitting exam automatically.");
    await submitExam(true);
  }, [submitExam]);

  const { formatted, isWarning, isDanger, clearTimer } = useExamTimer(
    examId,
    handleExpire,
  );

  // Sync answers on reconnect
  useEffect(() => {
    const handleOnline = () => syncPendingAnswers();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncPendingAnswers]);

  const handleViolation = useCallback((type: BehavioralEventType) => {
    const messages: Record<BehavioralEventType, string> = {
      tab_switch: "Tab switch detected!",
      fullscreen_exit: "Fullscreen exited!",
      focus_loss: "Window focus lost!",
    };
    setLastViolation(type);
    setViolations((prev) => [...prev, { type, time: new Date() }]);
    setShowViolationAlert(true);
    toast.warning(messages[type], { description: "This has been logged." });
  }, []);

  const { requestFullscreen } = useBehaviorTracking(handleViolation);

  // Load exam data and start session
  useEffect(() => {
    async function loadAndStart() {
      try {
        // Start the exam (create registration)
        const startRes = await axiosInstance.post<{
          data: { id: string; status: string };
        }>(`/candidate/exams/${examId}/start`);

        const reg = startRes.data.data;

        // Fetch exam details
        const examRes = await axiosInstance.get<{
          data: Exam & {
            question_sets: { id: string; questions: Question[] }[];
          };
        }>(`/candidate/exams/${examId}/details`);

        const examData = examRes.data.data;
        setExam(examData);

        // Flatten all questions
        const questions: Question[] = [];
        for (const qs of examData.question_sets ?? []) {
          for (const q of qs.questions ?? []) {
            questions.push(q);
          }
        }
        setAllQuestions(questions);

        // Dispatch session to Redux
        if (reg.status !== "submitted") {
          dispatch(
            startSession({
              registrationId: reg.id,
              examId,
              durationSeconds: examData.duration * 60,
            }),
          );
          // Request fullscreen for exam integrity
          requestFullscreen();
        } else {
          toast.info("You have already submitted this exam.");
          router.push("/candidate/dashboard");
        }
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { error?: string } };
          message?: string;
        };
        const message =
          axiosErr?.response?.data?.error ??
          axiosErr?.message ??
          "Failed to load exam";
        toast.error(message);
        router.push("/candidate/dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadAndStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const handleSubmit = async () => {
    clearTimer();
    await submitExam();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam || totalQuestions === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">
          No questions found for this exam.
        </p>
      </div>
    );
  }

  const skippedCount = skippedQuestions.size;

  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-base line-clamp-1 max-w-xs">
              {exam.title}
            </h1>
            <Badge variant="outline" className="hidden sm:flex">
              {answeredCount}/{totalQuestions} answered
            </Badge>
            {skippedCount > 0 && (
              <Badge
                variant="outline"
                className="hidden sm:flex border-amber-400 text-amber-600"
              >
                {skippedCount} skipped
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {violations.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {violations.length} violation
                {violations.length !== 1 ? "s" : ""}
              </Badge>
            )}
            <div
              className={`flex items-center gap-1.5 font-mono font-bold text-lg ${
                isDanger
                  ? "text-destructive"
                  : isWarning
                    ? "text-yellow-500"
                    : "text-foreground"
              }`}
            >
              <Clock className={`h-4 w-4 ${isDanger ? "animate-pulse" : ""}`} />
              {formatted}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => requestFullscreen()}
              title="Enter fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setShowSubmitDialog(true)}
              disabled={isSubmitted}
            >
              <Send className="mr-1.5 h-4 w-4" />
              Submit
            </Button>
          </div>
        </div>
        <Progress value={progressPercent} className="h-0.5 rounded-none" />
      </header>

      {/* Main content */}
      <div className="flex flex-1 container mx-auto px-4 py-6 gap-6">
        {/* Question area */}
        <div className="flex-1 max-w-2xl">
          {currentQuestion && (
            <QuestionRenderer
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalQuestions}
              currentAnswer={answers[currentQuestion.id]}
              skipped={skippedQuestions.has(currentQuestion.id)}
              onAnswer={(answer) => {
                saveAnswer(currentQuestion.id, answer);
                setSkippedQuestions((prev) => {
                  const next = new Set(prev);
                  next.delete(currentQuestion.id);
                  return next;
                });
              }}
              onSkip={() => {
                setSkippedQuestions((prev) =>
                  new Set(prev).add(currentQuestion.id),
                );
                navigateTo(currentQuestionIndex + 1);
              }}
              onPrev={() => navigateTo(currentQuestionIndex - 1)}
              onNext={() => navigateTo(currentQuestionIndex + 1)}
            />
          )}
        </div>

        {/* Sidebar: question navigator */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 space-y-3">
            <h3 className="text-sm font-semibold">Questions</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {allQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => navigateTo(idx)}
                  className={`flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-colors ${
                    idx === currentQuestionIndex
                      ? "bg-primary text-primary-foreground"
                      : answers[q.id] !== undefined
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : skippedQuestions.has(q.id)
                          ? "bg-amber-100 text-amber-600 border border-amber-300"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <Separator />
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-primary/20 border border-primary/30" />
                Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-amber-100 border border-amber-300" />
                Skipped
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-muted" />
                Not answered
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Submit confirmation */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {totalQuestions}{" "}
              questions.{" "}
              {answeredCount < totalQuestions &&
                `${totalQuestions - answeredCount} question(s) are unanswered. `}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Violation alert */}
      <AlertDialog
        open={showViolationAlert}
        onOpenChange={setShowViolationAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Integrity Violation Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lastViolation === "tab_switch" &&
                "You switched tabs or minimized the window. This action has been logged."}
              {lastViolation === "fullscreen_exit" &&
                "You exited fullscreen mode. Please return to fullscreen to continue the exam."}
              {lastViolation === "focus_loss" &&
                "The exam window lost focus. This action has been logged."}
              <br />
              <span className="font-medium">
                Total violations: {violations.length}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowViolationAlert(false);
                requestFullscreen();
              }}
            >
              Return to Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OfflineBanner />
    </div>
  );
}
