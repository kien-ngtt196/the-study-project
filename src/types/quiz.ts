export type GradeLevel = 6 | 7 | 8 | 9;

export type QuestionType = 'mcq' | 'true_false' | 'short_answer';

export type Difficulty = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export interface MCQQuestion {
  id: string;
  num: number;
  type: 'mcq';
  context?: string;
  imageUrl?: string;
  question: string;
  difficulty: Difficulty;
  options: string[];
  answer: string; // 'A' | 'B' | 'C' | 'D'
  explanation: string;
}

export interface TrueFalseStatement {
  key: string; // 'a', 'b', 'c', 'd'
  statement: string;
  answer: string; // 'Đ' | 'S'
}

export interface TrueFalseQuestion {
  id: string;
  num: number;
  type: 'true_false';
  context: string;
  imageUrl?: string;
  difficulty: Difficulty;
  statements: TrueFalseStatement[];
  explanation: string;
}

export interface ShortAnswerQuestion {
  id: string;
  num: number;
  type: 'short_answer';
  context?: string;
  imageUrl?: string;
  question: string;
  instruction?: string;
  difficulty: Difficulty;
  answer: string;
  explanation: string;
}

export type QuestionItem = MCQQuestion | TrueFalseQuestion | ShortAnswerQuestion;

export interface LessonTopic {
  id: string;
  title: string;
  grade: GradeLevel;
  mcq_questions: MCQQuestion[];
  tf_questions: TrueFalseQuestion[];
  sa_questions: ShortAnswerQuestion[];
}

export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  streakDays: number;
  lastStudyDate: string;
  gradeAccuracy: Record<GradeLevel, { total: number; correct: number }>;
  bookmarkedQuestionIds: string[];
  wrongQuestionIds: string[];
  examHistory: ExamResult[];
}

export interface ExamResult {
  id: string;
  date: string;
  grade: GradeLevel;
  score: number; // Max 10.0
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  detailScores: {
    mcqScore: number;
    tfScore: number;
    saScore: number;
  };
}

export interface TeamInfo {
  id: string;
  name: string;
  color: string; // Tailwind color class
  bgClass: string;
  borderClass: string;
  score: number;
}

export type ActiveTab = 'home' | 'study' | 'exam' | 'game' | 'analytics';

