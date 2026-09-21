import { UserStats, ExamResult, GradeLevel } from '../types/quiz';

const STORAGE_KEY = 'the_study_app_user_stats_v1';

const createDefaultStats = (): UserStats => ({
  totalAnswered: 0,
  totalCorrect: 0,
  streakDays: 1,
  lastStudyDate: new Date().toISOString().split('T')[0],
  gradeAccuracy: {
    8: { total: 0, correct: 0 },
    9: { total: 0, correct: 0 },
  },
  bookmarkedQuestionIds: [],
  wrongQuestionIds: [],
  examHistory: [],
});

const sanitizeCounter = (value: unknown): { total: number; correct: number } => {
  if (!value || typeof value !== 'object') return { total: 0, correct: 0 };
  const counter = value as { total?: unknown; correct?: unknown };
  const total = typeof counter.total === 'number' && counter.total >= 0 ? counter.total : 0;
  const correct = typeof counter.correct === 'number' && counter.correct >= 0
    ? Math.min(counter.correct, total)
    : 0;
  return { total, correct };
};

const isSupportedQuestionId = (value: unknown): value is string => (
  typeof value === 'string' && /^g(?:8|9)_/.test(value)
);

const isSupportedExam = (value: unknown): value is ExamResult => {
  if (!value || typeof value !== 'object') return false;
  const grade = (value as { grade?: unknown }).grade;
  return grade === 8 || grade === 9;
};

const sanitizeStoredStats = (value: unknown): UserStats => {
  const defaults = createDefaultStats();
  if (!value || typeof value !== 'object') return defaults;

  const stored = value as Partial<UserStats>;
  const grade8 = sanitizeCounter(stored.gradeAccuracy?.[8]);
  const grade9 = sanitizeCounter(stored.gradeAccuracy?.[9]);

  return {
    totalAnswered: grade8.total + grade9.total,
    totalCorrect: grade8.correct + grade9.correct,
    streakDays: typeof stored.streakDays === 'number' && stored.streakDays >= 0
      ? stored.streakDays
      : defaults.streakDays,
    lastStudyDate: typeof stored.lastStudyDate === 'string'
      ? stored.lastStudyDate
      : defaults.lastStudyDate,
    gradeAccuracy: {
      8: grade8,
      9: grade9,
    },
    bookmarkedQuestionIds: Array.isArray(stored.bookmarkedQuestionIds)
      ? stored.bookmarkedQuestionIds.filter(isSupportedQuestionId)
      : [],
    wrongQuestionIds: Array.isArray(stored.wrongQuestionIds)
      ? stored.wrongQuestionIds.filter(isSupportedQuestionId)
      : [],
    examHistory: Array.isArray(stored.examHistory)
      ? stored.examHistory.filter(isSupportedExam).slice(0, 30)
      : [],
  };
};

export const getStoredStats = (): UserStats => {
  if (typeof window === 'undefined') return createDefaultStats();
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return createDefaultStats();
    const sanitized = sanitizeStoredStats(JSON.parse(data));
    saveStats(sanitized);
    return sanitized;
  } catch {
    return createDefaultStats();
  }
};

export const saveStats = (stats: UserStats): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save user stats', e);
  }
};

export const recordAnswer = (grade: GradeLevel, isCorrect: boolean, questionId: string): UserStats => {
  const stats = getStoredStats();
  const today = new Date().toISOString().split('T')[0];

  stats.totalAnswered += 1;
  if (isCorrect) {
    stats.totalCorrect += 1;
    // Remove from wrong list if fixed
    stats.wrongQuestionIds = stats.wrongQuestionIds.filter((id) => id !== questionId);
  } else {
    if (!stats.wrongQuestionIds.includes(questionId)) {
      stats.wrongQuestionIds.push(questionId);
    }
  }

  // Update grade specific stats
  if (!stats.gradeAccuracy[grade]) {
    stats.gradeAccuracy[grade] = { total: 0, correct: 0 };
  }
  stats.gradeAccuracy[grade].total += 1;
  if (isCorrect) stats.gradeAccuracy[grade].correct += 1;

  // Update streak
  if (stats.lastStudyDate !== today) {
    const last = new Date(stats.lastStudyDate);
    const curr = new Date(today);
    const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 1) {
      stats.streakDays += 1;
    } else if (diffDays > 1) {
      stats.streakDays = 1;
    }
    stats.lastStudyDate = today;
  }

  saveStats(stats);
  return stats;
};

export const toggleBookmark = (questionId: string): boolean => {
  const stats = getStoredStats();
  const exists = stats.bookmarkedQuestionIds.includes(questionId);
  if (exists) {
    stats.bookmarkedQuestionIds = stats.bookmarkedQuestionIds.filter((id) => id !== questionId);
  } else {
    stats.bookmarkedQuestionIds.push(questionId);
  }
  saveStats(stats);
  return !exists;
};

export const recordExamResult = (result: ExamResult): UserStats => {
  const stats = getStoredStats();
  stats.examHistory.unshift(result); // Most recent first
  // Keep last 30 exams
  if (stats.examHistory.length > 30) {
    stats.examHistory = stats.examHistory.slice(0, 30);
  }
  saveStats(stats);
  return stats;
};

export const resetAllProgress = (): UserStats => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return createDefaultStats();
};
