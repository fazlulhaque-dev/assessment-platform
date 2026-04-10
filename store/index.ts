import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import examsReducer from "./slices/examsSlice";
import examSessionReducer from "./slices/examSessionSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exams: examsReducer,
    examSession: examSessionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
