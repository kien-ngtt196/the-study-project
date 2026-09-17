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

  // Get current topics based on active grade
  const currentTopics: LessonTopic[] = React.useMemo(() => {
    if (activeGrade === 8) return geo8Data as unknown as LessonTopic[];
    if (activeGrade === 9) return geo9Data as unknown as LessonTopic[];

    // Fallback topics for Grade 6 & Grade 7 using curated sample sets
    return [
      {
        id: `g${activeGrade}_fallback_l1`,
        title: `Bài 1. Vị trí và Khái quát Lớp ${activeGrade}`,
        grade: activeGrade,
        mcq_questions: [
          {
            id: `g${activeGrade}_mcq_1`,
            num: 1,
            type: 'mcq',
            question: `Đặc điểm tự nhiên nổi bật được học trong chương trình Lớp ${activeGrade} là gì?`,
            difficulty: 'Nhận biết',
            options: [
              'A. Khí hậu nhiệt đới ẩm gió mùa',
              'B. Khí hậu ôn đới lục địa',
              'C. Khí hậu hoang mạc khô hạn',
              'D. Khí hậu băng giá quanh năm'
            ],
            answer: 'A',
            explanation: 'Chương trình Lịch Sử và Địa Lý THCS tập trung nghiên cứu đặc điểm tự nhiên, khí hậu nhiệt đới ẩm gió mùa và địa lý Việt Nam.'
          }
        ],
        tf_questions: [
          {
            id: `g${activeGrade}_tf_1`,
            num: 1,
            type: 'true_false',
            context: `Ngữ liệu bài học Lớp ${activeGrade}: Lịch sử và Địa lý cung cấp kiến thức nền tảng về tự nhiên, dân cư và lịch sử dân tộc.`,
            difficulty: 'Thông hiểu',
            statements: [
              { key: 'a', statement: 'Môn học giúp học sinh hiểu rõ vị trí địa lý Việt Nam.', answer: 'Đ' },
              { key: 'b', statement: 'Việt Nam nằm ở khu vực Nam Mỹ.', answer: 'S' },
              { key: 'c', statement: 'Bản đồ là công cụ quan trọng trong học tập Địa lý.', answer: 'Đ' },
              { key: 'd', statement: 'Khí hậu Việt Nam mang tính chất nhiệt đới.', answer: 'Đ' }
            ],
            explanation: 'Dựa trên nội dung SGK Lịch sử & Địa lý THCS.'
          }
        ],
        sa_questions: [
          {
            id: `g${activeGrade}_sa_1`,
            num: 1,
            type: 'short_answer',
            question: `Hãy cho biết số lượng tỉnh và thành phố trực thuộc Trung ương của Việt Nam hiện nay?`,
            instruction: 'Nhập số nguyên.',
            difficulty: 'Vận dụng',
            answer: '63',
            explanation: 'Việt Nam hiện có 63 tỉnh và thành phố trực thuộc Trung ương.'
          }
        ]
      }
    ];
  }, [activeGrade]);

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
        <p>Hệ thống Học tập & Ôn Luyện Lịch Sử & Địa Lý THCS (Lớp 6, 7, 8, 9) • Chương Trình GDPT 2026-2027</p>
      </footer>
    </div>
  );
};
