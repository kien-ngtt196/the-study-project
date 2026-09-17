import { UserStats, ExamResult, GradeLevel } from '../types/quiz';

const STORAGE_KEY = 'the_study_app_user_stats_v1';

const defaultStats: UserStats = {
  totalAnswered: 0,
  totalCorrect: 0,
  streakDays: 1,
  lastStudyDate: new Date().toISOString().split('T')[0],
  gradeAccuracy: {
    6: { total: 0, correct: 0 },
    7: { total: 0, correct: 0 },
    8: { total: 0, correct: 0 },
    9: { total: 0, correct: 0 },
  },
  bookmarkedQuestionIds: [],
  wrongQuestionIds: [],
  examHistory: [],
};

export const getStoredStats = (): UserStats => {
  if (typeof window === 'undefined') return defaultStats;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return defaultStats;
    const parsed = JSON.parse(data);
    return { ...defaultStats, ...parsed };
  } catch {
    return defaultStats;
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
  return defaultStats;
};
