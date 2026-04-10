"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { tick, setTimeRemaining } from "@/store/slices/examSessionSlice";

const STORAGE_KEY_PREFIX = "exam_timer_";

export function useExamTimer(examId: string | null, onExpire: () => void) {
  const dispatch = useAppDispatch();
  const timeRemaining = useAppSelector((s) => s.examSession.timeRemaining);
  const isSubmitted = useAppSelector((s) => s.examSession.isSubmitted);
  const isStarted = useAppSelector((s) => s.examSession.isStarted);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref current without restarting timer
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Restore from localStorage on mount (offline resilience)
  useEffect(() => {
    if (!examId) return;
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${examId}`);
    if (stored) {
      const saved = parseInt(stored, 10);
      if (!isNaN(saved) && saved > 0) {
        dispatch(setTimeRemaining(saved));
      }
    }
  }, [examId, dispatch]);

  // Tick interval
  useEffect(() => {
    if (isSubmitted || !isStarted || timeRemaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      dispatch(tick());
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSubmitted, dispatch, timeRemaining]);

  // Persist to localStorage every second
  useEffect(() => {
    if (!examId || timeRemaining <= 0 || isSubmitted) return;
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${examId}`,
      String(timeRemaining),
    );
  }, [examId, timeRemaining, isSubmitted]);

  // Trigger expire
  useEffect(() => {
    if (timeRemaining === 0 && !isSubmitted && isStarted) {
      if (examId) localStorage.removeItem(`${STORAGE_KEY_PREFIX}${examId}`);
      onExpireRef.current();
    }
  }, [timeRemaining, isSubmitted, isStarted, examId]);

  const clearTimer = useCallback(() => {
    if (examId) localStorage.removeItem(`${STORAGE_KEY_PREFIX}${examId}`);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [examId]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isWarning = timeRemaining <= 300 && timeRemaining > 0; // last 5 min
  const isDanger = timeRemaining <= 60 && timeRemaining > 0;

  return { timeRemaining, formatted, isWarning, isDanger, clearTimer };
}
