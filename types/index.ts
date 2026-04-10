export type UserRole = "employer" | "candidate";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  created_at?: string;
}

export interface Exam {
  id: string;
  employer_id: string;
  title: string;
  total_candidates: number;
  total_slots: number;
  start_time: string;
  end_time: string;
  duration: number; // minutes
  negative_marking: boolean;
  created_at?: string;
  question_sets?: QuestionSet[];
  _count?: {
    exam_registrations: number;
    question_sets: number;
  };
}

export interface QuestionSet {
  id: string;
  exam_id: string;
  title: string;
  created_at?: string;
  questions?: Question[];
}

export type QuestionType = "checkbox" | "radio" | "text";

export interface Question {
  id: string;
  question_set_id: string;
  title: string;
  type: QuestionType;
  options: string[] | null;
  correct_answers: string[] | null;
  created_at?: string;
}

export type RegistrationStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "expired";

export interface ExamRegistration {
  id: string;
  exam_id: string;
  candidate_id: string;
  status: RegistrationStatus;
  started_at: string | null;
  submitted_at: string | null;
  created_at?: string;
  exam?: Exam;
  candidate?: Profile;
}

export interface ExamAnswer {
  id: string;
  registration_id: string;
  question_id: string;
  answer: string | string[] | null;
  created_at?: string;
}

export type BehavioralEventType =
  | "tab_switch"
  | "fullscreen_exit"
  | "focus_loss";

export interface BehavioralLog {
  id: string;
  registration_id: string;
  event_type: BehavioralEventType;
  logged_at: string;
}

// API response shapes
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Form payload types
export interface CreateExamStep1 {
  title: string;
  total_candidates: number;
  total_slots: number;
  question_sets_count: number;
  question_type: QuestionType;
  start_time: string;
  end_time: string;
  duration: number;
  negative_marking: boolean;
}

export interface CreateQuestionPayload {
  title: string;
  type: QuestionType;
  options: string[];
  correct_answers: string[];
}

export interface CreateExamPayload {
  basicInfo: CreateExamStep1;
  questionSets: {
    title: string;
    questions: CreateQuestionPayload[];
  }[];
}

// Answers stored locally during exam
export type AnswersMap = Record<string, string | string[]>;
