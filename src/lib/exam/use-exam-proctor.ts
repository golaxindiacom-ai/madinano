"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProctoringViolation, ProctoringViolationType } from "@/lib/admin/types";

type ProctorConfig = {
  enabled: boolean;
  maxViolations: number;
  autoSubmit: boolean;
  requireFullscreen: boolean;
};

type Options = {
  examId: string;
  attemptId: string;
  config: ProctorConfig;
  onViolation?: (count: number, max: number) => void;
  onAutoSubmit?: () => void;
};

export function useExamProctor({ examId, attemptId, config, onViolation, onAutoSubmit }: Options) {
  const [violationCount, setViolationCount] = useState(0);
  const [warning, setWarning] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const violationsRef = useRef<ProctoringViolation[]>([]);
  const submittingRef = useRef(false);

  const logViolation = useCallback(
    async (type: ProctoringViolationType, detail?: string) => {
      if (!config.enabled || submittingRef.current) return;

      const violation: ProctoringViolation = {
        type,
        at: new Date().toISOString(),
        detail,
      };
      violationsRef.current.push(violation);

      try {
        await fetch(`/api/exams/${examId}/proctor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, violation }),
        });
      } catch {
        /* ignore */
      }

      setViolationCount((c) => {
        const next = c + 1;
        onViolation?.(next, config.maxViolations);
        if (next >= config.maxViolations) {
          setWarning(
            config.autoSubmit
              ? "Maximum violations reached. Submitting exam automatically..."
              : `Warning: ${next} proctoring violations recorded.`,
          );
          if (config.autoSubmit && !submittingRef.current) {
            submittingRef.current = true;
            setTimeout(() => onAutoSubmit?.(), 1500);
          }
        } else {
          setWarning(
            `Tab switch detected (${next}/${config.maxViolations}). Stay on this screen during the exam.`,
          );
        }
        return next;
      });
    },
    [config, examId, attemptId, onViolation, onAutoSubmit],
  );

  const enterFullscreen = useCallback(async () => {
    if (!config.requireFullscreen) return;
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      setWarning("Fullscreen recommended for this exam. Please enable it.");
    }
  }, [config.requireFullscreen]);

  useEffect(() => {
    if (!config.enabled) return;

    const onVisibility = () => {
      if (document.hidden) logViolation("tab_switch", "Document hidden / tab switched");
    };

    const onBlur = () => {
      if (document.hidden) return;
      logViolation("window_blur", "Window lost focus");
    };

    const onFullscreenChange = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      if (config.requireFullscreen && !fs) {
        logViolation("fullscreen_exit", "Exited fullscreen mode");
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [config.enabled, config.requireFullscreen, logViolation]);

  const getProctoringPayload = useCallback(
    () => ({
      tabSwitchCount: violationCount,
      proctoringViolations: violationsRef.current,
      autoSubmittedByProctor:
        config.autoSubmit && violationCount >= config.maxViolations && submittingRef.current,
    }),
    [violationCount, config.autoSubmit, config.maxViolations],
  );

  return {
    violationCount,
    warning,
    isFullscreen,
    enterFullscreen,
    getProctoringPayload,
    dismissWarning: () => setWarning(""),
    markSubmitting: () => {
      submittingRef.current = true;
    },
  };
}
