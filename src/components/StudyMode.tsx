import React, { useState, useMemo } from 'react';
import { GradeLevel, LessonTopic, QuestionItem } from '../types/quiz';
import { QuizCard } from './QuizCard';
import { BookOpen, Filter, CheckCircle, RotateCcw, AlertTriangle, Sparkles, ChevronRight, Search } from 'lucide-react';
import { sounds } from '../utils/audio';

interface StudyModeProps {
  grade: GradeLevel;
  topics: LessonTopic[];
  bookmarkedIds: string[];
  wrongIds: string[];
  onToggleBookmark: (qId: string) => void;
  onAnswerSubmit: (isCorrect: boolean, qId: string) => void;
  onSelectGrade?: (grade: GradeLevel) => void;
}

export const StudyMode: React.FC<StudyModeProps> = ({
  grade,
  topics,
  bookmarkedIds,
  wrongIds,
  onToggleBookmark,
  onAnswerSubmit,
  onSelectGrade,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyWrong, setOnlyWrong] = useState<boolean>(false);
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Flatten all questions for current grade
  const allQuestions = useMemo(() => {
    let qList: { q: QuestionItem; topicTitle: string }[] = [];
    topics.forEach((t) => {
      t.mcq_questions.forEach((q) => qList.push({ q, topicTitle: t.title }));
      t.tf_questions.forEach((q) => qList.push({ q, topicTitle: t.title }));
      t.sa_questions.forEach((q) => qList.push({ q, topicTitle: t.title }));
    });
    return qList;
  }, [topics]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(({ q, topicTitle }) => {
      // Filter by Topic
      if (selectedTopicId !== 'all') {
        const topic = topics.find((t) => t.id === selectedTopicId);
        if (topic && !topicTitle.includes(topic.title)) return false;
      }
      // Filter by Difficulty
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
      // Filter by Type
      if (selectedType !== 'all' && q.type !== selectedType) return false;
      // Filter Only Wrong
      if (onlyWrong && !wrongIds.includes(q.id)) return false;
      // Filter Only Bookmarked
      if (onlyBookmarked && !bookmarkedIds.includes(q.id)) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const mainText = q.type === 'mcq' ? q.question : q.type === 'true_false' ? q.context : q.question;
        if (!mainText.toLowerCase().includes(query) && !topicTitle.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [allQuestions, selectedTopicId, selectedDifficulty, selectedType, onlyWrong, onlyBookmarked, searchQuery, topics, wrongIds, bookmarkedIds]);

  const currentItem = filteredQuestions[currentIndex];

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      sounds.playClick();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      sounds.playClick();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Scenic Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/30 shadow-2xl h-44 sm:h-52 group">
        <img
          src="/images/vietnam_hero.jpg"
          alt="Mù Cang Chải Terraces"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06181e] via-[#06181e]/85 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#06181e] via-transparent to-transparent"></div>

        <div className="relative z-10 h-full flex flex-col justify-end p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 backdrop-blur-md">
              Hành Trình Tri Thức Đất Nước
            </span>
            <span className="text-xs text-[#E8D8C8]/80 font-medium">Lớp {grade}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-vn font-bold text-white tracking-wide gradient-text-gold drop-shadow-md">
            Khám Phá Lịch Sử & Địa Lý Việt Nam
          </h2>
          <p className="text-xs text-[#E8D8C8]/90 font-sans-vn mt-1 max-w-lg line-clamp-2">
            Hệ thống ngân hàng câu hỏi chuẩn cấu trúc mới 2026 với 3 dạng thức trắc nghiệm phân hóa sắc nét.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="vietnam-glass rounded-2xl p-5 border border-[#D4AF37]/25 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-base font-bold text-[#E8D8C8] font-serif-vn">
                Bộ Lọc Bài Học
              </h3>
            </div>

            {/* Contextual Grade Switcher */}
            {onSelectGrade && (
              <div className="flex items-center gap-1 p-1 bg-[#06181e] rounded-xl border border-[#D4AF37]/30">
                {([6, 7, 8, 9] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      sounds.playClick();
                      onSelectGrade(g);
                      setSelectedTopicId('all');
                      setCurrentIndex(0);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-sans-vn transition-all ${
                      grade === g
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#051419] font-extrabold shadow-sm scale-105'
                        : 'text-[#E8D8C8]/70 hover:text-white hover:bg-[#0F3B46]/50'
                    }`}
                  >
                    Lớp {g}
                  </button>
                ))}
              </div>
            )}

            <span className="text-xs px-2.5 py-1 rounded-full bg-[#1B4D3E]/60 text-[#D4AF37] border border-[#D4AF37]/30 font-semibold font-sans-vn">
              {filteredQuestions.length} Câu Hỏi
            </span>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => {
                sounds.playClick();
                setOnlyWrong(!onlyWrong);
                if (!onlyWrong) setOnlyBookmarked(false);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 btn-emil-press ${
                onlyWrong
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                  : 'bg-[#06181e]/80 text-[#E8D8C8]/70 border-[#D4AF37]/20 hover:text-[#E8D8C8] hover:border-[#D4AF37]/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Câu Chưa Đúng ({wrongIds.length})</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setOnlyBookmarked(!onlyBookmarked);
                if (!onlyBookmarked) setOnlyWrong(false);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 btn-emil-press ${
                onlyBookmarked
                  ? 'bg-[#D4AF37]/25 text-[#D4AF37] border-[#D4AF37]/50 shadow-sm'
                  : 'bg-[#06181e]/80 text-[#E8D8C8]/70 border-[#D4AF37]/20 hover:text-[#E8D8C8] hover:border-[#D4AF37]/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Đã Đánh Dấu ({bookmarkedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          {/* Topic Select */}
          <select
            value={selectedTopicId}
            onChange={(e) => {
              setSelectedTopicId(e.target.value);
              setCurrentIndex(0);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Tất cả bài học ({topics.length} Bài)</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          {/* Difficulty Select */}
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setCurrentIndex(0);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="Nhận biết">Nhận biết</option>
            <option value="Thông hiểu">Thông hiểu</option>
            <option value="Vận dụng">Vận dụng</option>
          </select>

          {/* Question Type Select */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentIndex(0);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Tất cả dạng thức</option>
            <option value="mcq">Trắc nghiệm 4 đáp án</option>
            <option value="true_false">Đúng / Sai 4 ý</option>
            <option value="short_answer">Trả lời ngắn / Tính toán</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              placeholder="Tìm từ khóa..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Question Display Card */}
      {filteredQuestions.length > 0 && currentItem ? (
        <div className="space-y-4">
          <div className="text-xs text-emerald-400 font-semibold px-1">
            📍 {currentItem.topicTitle}
          </div>

          <QuizCard
            key={currentItem.q.id}
            question={currentItem.q}
            index={currentIndex}
            total={filteredQuestions.length}
            isBookmarked={bookmarkedIds.includes(currentItem.q.id)}
            onToggleBookmark={onToggleBookmark}
            onAnswerSubmit={onAnswerSubmit}
          />

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              ← Câu Trước
            </button>

            <span className="text-xs font-semibold text-slate-400">
              {currentIndex + 1} / {filteredQuestions.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex === filteredQuestions.length - 1}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <span>Câu Tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel rounded-2xl p-10 text-center space-y-4 border border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">Không Tìm Thấy Câu Hỏi Thích Hợp</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Vui lòng thay đổi bộ lọc bài học, độ khó hoặc loại câu hỏi để tiếp tục luyện tập.
          </p>
          <button
            onClick={() => {
              setSelectedTopicId('all');
              setSelectedDifficulty('all');
              setSelectedType('all');
              setOnlyWrong(false);
              setOnlyBookmarked(false);
              setSearchQuery('');
              setCurrentIndex(0);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
          >
            Xóa Tất Cả Bộ Lọc
          </button>
        </div>
      )}
    </div>
  );
};
