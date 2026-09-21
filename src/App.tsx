import React, { useState, useEffect } from 'react';
import { GradeLevel, ActiveTab, LessonTopic, UserStats, ExamResult } from './types/quiz';
import { Header } from './components/Header';
import { LandingHome } from './components/LandingHome';
import { StudyMode } from './components/StudyMode';
import { ExamMode } from './components/ExamMode';
import { ClassroomGameMode } from './components/ClassroomGameMode';
import { StudentMobileView } from './components/StudentMobileView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

import geo8Data from './data/geography_8.json';
import geo9Data from './data/geography_9.json';
import { getStoredStats, recordAnswer, toggleBookmark, recordExamResult, resetAllProgress } from './utils/storage';
import { sounds } from './utils/audio';

export const App: React.FC = () => {
  const [activeGrade, setActiveGrade] = useState<GradeLevel>(8);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Student Phone Controller mode state
  const [isStudentMode, setIsStudentMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'student';
    }
    return false;
  });

  const [initialPin, setInitialPin] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('pin') || '';
    }
    return '';
  });


  // LocalStorage User Stats
  const [stats, setStats] = useState<UserStats>(getStoredStats());

  useEffect(() => {
    sounds.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const currentTopics: LessonTopic[] = activeGrade === 8
    ? geo8Data as unknown as LessonTopic[]
    : geo9Data as unknown as LessonTopic[];

  const handleAnswerSubmit = (isCorrect: boolean, questionId: string) => {
    const updated = recordAnswer(activeGrade, isCorrect, questionId);
    setStats(updated);
  };

  const handleToggleBookmark = (questionId: string) => {
    toggleBookmark(questionId);
    setStats(getStoredStats());
  };

  const handleFinishExam = (result: ExamResult) => {
    const updated = recordExamResult(result);
    setStats(updated);
  };

  const handleResetStats = () => {
    const updated = resetAllProgress();
    setStats(updated);
  };

  if (isStudentMode) {
    return <StudentMobileView initialPin={initialPin} onExit={() => setIsStudentMode(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">

      
      {/* Top App Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        streakDays={stats.streakDays}
        onOpenStudentMode={() => setIsStudentMode(true)}
      />


      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && (
          <LandingHome
            activeGrade={activeGrade}
            onSelectGrade={(g) => setActiveGrade(g)}
            onSelectTab={(t) => setActiveTab(t)}
            onOpenStudentMode={() => setIsStudentMode(true)}
            totalAnswered={stats.totalAnswered}
            streakDays={stats.streakDays}
          />
        )}

        {activeTab === 'study' && (
          <StudyMode
            grade={activeGrade}
            topics={currentTopics}
            bookmarkedIds={stats.bookmarkedQuestionIds}
            wrongIds={stats.wrongQuestionIds}
            onToggleBookmark={handleToggleBookmark}
            onAnswerSubmit={handleAnswerSubmit}
            onSelectGrade={(g) => setActiveGrade(g)}
          />
        )}

        {activeTab === 'exam' && (
          <ExamMode
            grade={activeGrade}
            topics={currentTopics}
            onFinishExam={handleFinishExam}
            onSelectGrade={(g) => setActiveGrade(g)}
          />
        )}

        {activeTab === 'game' && (
          <ClassroomGameMode 
            grade={activeGrade} 
            topics={currentTopics} 
            onSelectGrade={(g) => setActiveGrade(g)}
          />
        )}


        {activeTab === 'analytics' && (
          <AnalyticsDashboard stats={stats} onStatsReset={handleResetStats} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <p>Hệ thống Học tập & Ôn Luyện Lịch Sử & Địa Lý THCS (Lớp 8, 9) • Chương Trình GDPT 2026-2027</p>
      </footer>
    </div>
  );
};
