import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Exam } from "@/types";

interface ExamsState {
  exams: Exam[];
  currentExam: Exam | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ExamsState = {
  exams: [],
  currentExam: null,
  isLoading: false,
  error: null,
};

const examsSlice = createSlice({
  name: "exams",
  initialState,
  reducers: {
    setExams(state, action: PayloadAction<Exam[]>) {
      state.exams = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setCurrentExam(state, action: PayloadAction<Exam | null>) {
      state.currentExam = action.payload;
    },
    addExam(state, action: PayloadAction<Exam>) {
      state.exams.unshift(action.payload);
    },
    setExamsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setExamsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setExams,
  setCurrentExam,
  addExam,
  setExamsLoading,
  setExamsError,
} = examsSlice.actions;
export default examsSlice.reducer;
