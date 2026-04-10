"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { recordBehavioralEvent } from "@/store/slices/examSessionSlice";
import axiosInstance from "@/lib/axios";
import { BehavioralEventType } from "@/types";

export function useBehaviorTracking(
  onViolation?: (type: BehavioralEventType) => void,
) {
  const dispatch = useAppDispatch();
  const { registrationId, examId, isSubmitted } = useAppSelector(
    (s) => s.examSession,
  );
  const onViolationRef = useRef(onViolation);

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  const logEvent = useCallback(
    async (eventType: BehavioralEventType) => {
      if (!registrationId || !examId || isSubmitted) return;
      dispatch(recordBehavioralEvent(eventType));
      onViolationRef.current?.(eventType);
      try {
        await axiosInstance.post(`/candidate/exams/${examId}/behavioral`, {
          registrationId,
          eventType,
        });
      } catch {
        // Silently fail — behavioral logs are best-effort
      }
    },
    [registrationId, examId, isSubmitted, dispatch],
  );

  // Tab switch / visibility change
  useEffect(() => {
    if (isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logEvent("tab_switch");
      }
    };

    const handleBlur = () => {
      logEvent("focus_loss");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logEvent("fullscreen_exit");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isSubmitted, logEvent]);

  const requestFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  return { requestFullscreen };
}
