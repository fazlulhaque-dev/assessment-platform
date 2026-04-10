import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AnswersMap, BehavioralEventType } from "@/types";

interface BehavioralEvent {
  type: BehavioralEventType;
  timestamp: number;
}

interface ExamSessionState {
  registrationId: string | null;
  examId: string | null;
  answers: AnswersMap;
  currentQuestionIndex: number;
  timeRemaining: number; // seconds
  isSubmitted: boolean;
  isStarted: boolean;
  behavioralEvents: BehavioralEvent[];
  pendingSyncAnswers: { questionId: string; answer: string | string[] }[];
}

const initialState: ExamSessionState = {
  registrationId: null,
  examId: null,
  answers: {},
  currentQuestionIndex: 0,
  timeRemaining: 0,
  isSubmitted: false,
  isStarted: false,
  behavioralEvents: [],
  pendingSyncAnswers: [],
};

const examSessionSlice = createSlice({
  name: "examSession",
  initialState,
  reducers: {
    startSession(
      state,
      action: PayloadAction<{
        registrationId: string;
        examId: string;
        durationSeconds: number;
      }>,
    ) {
      state.registrationId = action.payload.registrationId;
      state.examId = action.payload.examId;
      state.timeRemaining = action.payload.durationSeconds;
      state.isStarted = true;
      state.isSubmitted = false;
      state.answers = {};
      state.currentQuestionIndex = 0;
      state.behavioralEvents = [];
    },
    setAnswer(
      state,
      action: PayloadAction<{ questionId: string; answer: string | string[] }>,
    ) {
      state.answers[action.payload.questionId] = action.payload.answer;
      // Queue for offline sync
      const existing = state.pendingSyncAnswers.findIndex(
        (a) => a.questionId === action.payload.questionId,
      );
      if (existing >= 0) {
        state.pendingSyncAnswers[existing].answer = action.payload.answer;
      } else {
        state.pendingSyncAnswers.push({
          questionId: action.payload.questionId,
          answer: action.payload.answer,
        });
      }
    },
    clearPendingSync(state) {
      state.pendingSyncAnswers = [];
    },
    setCurrentQuestion(state, action: PayloadAction<number>) {
      state.currentQuestionIndex = action.payload;
    },
    tick(state) {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
    },
    setTimeRemaining(state, action: PayloadAction<number>) {
      state.timeRemaining = action.payload;
    },
    submitSession(state) {
      state.isSubmitted = true;
    },
    recordBehavioralEvent(state, action: PayloadAction<BehavioralEventType>) {
      state.behavioralEvents.push({
        type: action.payload,
        timestamp: Date.now(),
      });
    },
    resetSession() {
      return initialState;
    },
  },
});

export const {
  startSession,
  setAnswer,
  clearPendingSync,
  setCurrentQuestion,
  tick,
  setTimeRemaining,
  submitSession,
  recordBehavioralEvent,
  resetSession,
} = examSessionSlice.actions;
export default examSessionSlice.reducer;
