export interface Faculty {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  faculty_id: number;
  is_active: boolean;
  created_at: string;
}

export interface UserOut {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  faculty_id: number | null;
  group_id: number | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  is_active: boolean;
  is_archived: boolean;
  visible_to_all_faculties: boolean;
  faculty_ids: number[];
  created_at: string;
}

export interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  is_active: boolean;
  is_archived: boolean;
  total_questions_per_test: number;
  time_per_question_seconds: number;
  allow_back_navigation: boolean;
  available_from: string | null;
  available_until: string | null;
  created_at: string;
}

export interface AnswerIn {
  text: string;
  is_correct: boolean;
}

export interface AnswerOut {
  id: number;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: number;
  subcategory_id: number;
  text: string;
  difficulty: "easy" | "medium" | "hard";
  is_active: boolean;
  created_at: string;
  answers: AnswerOut[];
}

export interface AnswerOption {
  id: number;
  text: string;
}

export interface CurrentQuestion {
  session_id: number;
  subcategory_name: string;
  position: number;
  total_questions: number;
  time_per_question_seconds: number;
  remaining_seconds: number;
  allow_back_navigation: boolean;
  resumed: boolean;
  question_id: number;
  question_text: string;
  options: AnswerOption[];
  previous_selected_answer_id: number | null;
}

export interface SubmitAnswerResponse {
  finished: boolean;
  next_question: CurrentQuestion | null;
}

export interface ResultAnswer {
  question_id: number;
  question_text: string;
  options: { id: number; text: string; is_correct: boolean }[];
  selected_answer_id: number | null;
  is_correct: boolean;
  is_timed_out: boolean;
}

export interface TestResult {
  session_id: number;
  subcategory_id: number;
  subcategory_name: string;
  status: string;
  total_questions: number;
  correct_count: number;
  percent: number;
  answers: ResultAnswer[];
}

export interface HistoryItem {
  session_id: number;
  subcategory_id: number;
  subcategory_name: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  total_questions: number;
  correct_count: number;
  percent: number;
}
