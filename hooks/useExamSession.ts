"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setAnswer,
  setCurrentQuestion,
  submitSession,
  clearPendingSync,
} from "@/store/slices/examSessionSlice";
import { Question } from "@/types";
import { toast } from "sonner";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

const IDB_ANSWERS_PREFIX = "exam_answers_";

export function useExamSession(questions: Question[]) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    registrationId,
    examId,
    answers,
    currentQuestionIndex,
    isSubmitted,
    pendingSyncAnswers,
  } = useAppSelector((s) => s.examSession);

  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const saveAnswer = useCallback(
    async (questionId: string, answer: string | string[]) => {
      dispatch(setAnswer({ questionId, answer }));

      // Persist to IndexedDB for offline resilience
      const idbKey = `${IDB_ANSWERS_PREFIX}${registrationId}`;
      const stored =
        (await idbGet<Record<string, string | string[]>>(idbKey)) ?? {};
      stored[questionId] = answer;
      await idbSet(idbKey, stored);

      // Try to sync online immediately
      if (navigator.onLine && registrationId && examId) {
        try {
          await axiosInstance.post(`/candidate/exams/${examId}/answer`, {
            registrationId,
            questionId,
            answer,
          });
        } catch {
          // Will be synced on reconnect
        }
      }
    },
    [dispatch, registrationId, examId],
  );

  const syncPendingAnswers = useCallback(async () => {
    if (!navigator.onLine || !registrationId || !examId) return;
    const idbKey = `${IDB_ANSWERS_PREFIX}${registrationId}`;
    const stored = await idbGet<Record<string, string | string[]>>(idbKey);
    if (!stored) return;

    for (const [questionId, answer] of Object.entries(stored)) {
      try {
        await axiosInstance.post(`/candidate/exams/${examId}/answer`, {
          registrationId,
          questionId,
          answer,
        });
      } catch {
        // Continue with others
      }
    }
    dispatch(clearPendingSync());
    await idbDel(idbKey);
  }, [registrationId, examId, dispatch]);

  const navigateTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) {
        dispatch(setCurrentQuestion(index));
      }
    },
    [dispatch, totalQuestions],
  );

  const submitExam = useCallback(
    async (force = false) => {
      if (!registrationId || !examId) return;

      // Sync any pending offline answers first
      await syncPendingAnswers();

      try {
        await axiosInstance.post(`/candidate/exams/${examId}/submit`, {
          registrationId,
        });
        dispatch(submitSession());
        const idbKey = `${IDB_ANSWERS_PREFIX}${registrationId}`;
        await idbDel(idbKey);
        if (!force) {
          toast.success("Exam submitted successfully!");
        }
        router.push("/candidate/dashboard");
      } catch (err) {
        toast.error("Failed to submit exam. Please try again.");
        throw err;
      }
    },
    [registrationId, examId, dispatch, router, syncPendingAnswers],
  );

  return {
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
    pendingSyncCount: pendingSyncAnswers.length,
  };
}
