import React, { useState } from 'react';
import { QuestionItem, MCQQuestion, TrueFalseQuestion, ShortAnswerQuestion } from '../types/quiz';
import { Bookmark, BookmarkCheck, CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp, Sparkles, Send } from 'lucide-react';
import { sounds } from '../utils/audio';

interface QuizCardProps {
  question: QuestionItem;
  index: number;
  total: number;
  isBookmarked: boolean;
  onToggleBookmark: (qId: string) => void;
  onAnswerSubmit: (isCorrect: boolean, qId: string) => void;
  showExplanationDirectly?: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  index,
  total,
  isBookmarked,
  onToggleBookmark,
  onAnswerSubmit,
  showExplanationDirectly = false,
}) => {
  // State for MCQ
  const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);

  // State for True/False (keys: 'a', 'b', 'c', 'd') -> value: 'Đ' | 'S'
  const [tfAnswers, setTfAnswers] = useState<Record<string, string>>({});
  const [tfSubmitted, setTfSubmitted] = useState<boolean>(false);

  // State for Short Answer
  const [saInput, setSaInput] = useState<string>('');
  const [saSubmitted, setSaSubmitted] = useState<boolean>(false);

  // Toggle explanation expand
  const [showExplanation, setShowExplanation] = useState<boolean>(showExplanationDirectly);

  // Handle MCQ selection
  const handleMCQSelect = (optLetter: string) => {
    if (selectedMCQ) return; // Answered
    setSelectedMCQ(optLetter);
    const isCorrect = optLetter === (question as MCQQuestion).answer;
    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playIncorrect();
    }
    onAnswerSubmit(isCorrect, question.id);
  };

  // Handle True/False statement selection
  const handleTfSelect = (key: string, value: 'Đ' | 'S') => {
    if (tfSubmitted) return;
    sounds.playClick();
    setTfAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleTfSubmit = () => {
    if (tfSubmitted) return;
    setTfSubmitted(true);
    const tfQ = question as TrueFalseQuestion;
    const allCorrect = tfQ.statements.every(
      (st) => tfAnswers[st.key] && tfAnswers[st.key].toUpperCase() === st.answer.toUpperCase()
    );

    if (allCorrect) {
      sounds.playCorrect();
      sounds.triggerConfetti();
    } else {
      sounds.playIncorrect();
    }
    onAnswerSubmit(allCorrect, question.id);
  };

  // Handle Short Answer submission
  const handleSaSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (saSubmitted || !saInput.trim()) return;
    setSaSubmitted(true);

    const saQ = question as ShortAnswerQuestion;
    // Normalize both for comparison (remove spaces, replace comma with dot)
    const normalizedInput = saInput.trim().replace(',', '.').toLowerCase();
    const normalizedAns = saQ.answer.trim().replace(',', '.').toLowerCase();

    // Check exact match or numerical close match
    const numInput = parseFloat(normalizedInput);
    const numAns = parseFloat(normalizedAns);

    let isCorrect = normalizedInput === normalizedAns;
    if (!isNaN(numInput) && !isNaN(numAns)) {
      isCorrect = Math.abs(numInput - numAns) < 0.15;
    }

    if (isCorrect) {
      sounds.playCorrect();
      sounds.triggerConfetti();
    } else {
      sounds.playIncorrect();
    }
    onAnswerSubmit(isCorrect, question.id);
  };

  const difficultyColor = (diff: string) => {
    switch (diff) {
      case 'Nhận biết':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Thông hiểu':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Vận dụng':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-7 space-y-6 relative border border-slate-800 shadow-xl transition-all duration-300">
      
      {/* Question Header & Tags */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
            Câu {index + 1} / {total}
          </span>
          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${difficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {question.type === 'mcq' && 'Trắc nghiệm 4 đáp án'}
            {question.type === 'true_false' && 'Đúng / Sai 4 ý'}
            {question.type === 'short_answer' && 'Trả lời ngắn / Tính toán'}
          </span>
        </div>

        {/* Bookmark Action */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleBookmark(question.id);
          }}
          className={`p-2 rounded-xl border transition-all ${
            isBookmarked
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-400 hover:border-amber-500/30'
          }`}
          title={isBookmarked ? 'Bỏ đánh dấu' : 'Lưu câu hỏi này'}
        >
          {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-400" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      {/* Pedagogical Context Scenario */}
      {question.context && (
        <div className="p-4 rounded-2xl bg-[#06181e] border border-[#D4AF37]/35 space-y-1.5 shadow-inner">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-sans-vn">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Tư Liệu & Ngữ Cảnh Bài Học</span>
          </div>
          <p className="text-xs sm:text-sm text-[#E8D8C8]/90 leading-relaxed font-sans-vn italic">
            "{question.context}"
          </p>
        </div>
      )}

      {/* Image Illustration */}
      {question.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/30 max-h-80 shadow-lg">
          <img 
            src={question.imageUrl} 
            alt="Hình ảnh minh họa bài học" 
            className="w-full h-full object-cover max-h-80 hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/vietnam_map.jpg';
            }}
          />
        </div>
      )}

      {/* RENDER DẠNG 1: MCQ */}
      {question.type === 'mcq' && (
        <div className="space-y-5">
          <h3 className="text-base sm:text-lg font-semibold text-slate-100 leading-relaxed">
            {(question as MCQQuestion).question}
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {(question as MCQQuestion).options.map((optionText, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx); // 'A', 'B', 'C', 'D'
              const mcqQ = question as MCQQuestion;
              const isSelected = selectedMCQ === letter;
              const isCorrectAnswer = letter === mcqQ.answer;

              let buttonStyle = 'bg-slate-900/90 text-slate-200 border-slate-800 hover:bg-slate-800 hover:border-slate-700';

              if (selectedMCQ) {
                if (isCorrectAnswer) {
                  buttonStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10 font-semibold';
                } else if (isSelected && !isCorrectAnswer) {
                  buttonStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
                } else {
                  buttonStyle = 'bg-slate-900/40 text-slate-500 border-slate-900 opacity-60';
                }
              }

              return (
                <button
                  key={letter}
                  onClick={() => handleMCQSelect(letter)}
                  disabled={!!selectedMCQ}
                  className={`w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-all duration-200 ${buttonStyle}`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    selectedMCQ && isCorrectAnswer
                      ? 'bg-emerald-500 text-slate-950'
                      : selectedMCQ && isSelected && !isCorrectAnswer
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {letter}
                  </span>
                  <span className="text-sm leading-snug pt-0.5">{optionText}</span>
                  {selectedMCQ && isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto shrink-0" />}
                  {selectedMCQ && isSelected && !isCorrectAnswer && <XCircle className="w-5 h-5 text-rose-400 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDER DẠNG 2: TRUE / FALSE CLUSTER */}
      {question.type === 'true_false' && (
        <div className="space-y-5">
          {/* Context / Stem */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm leading-relaxed font-medium">
            <span className="text-xs uppercase font-bold text-emerald-400 block mb-1">Ngữ liệu & Thông tin:</span>
            {(question as TrueFalseQuestion).context}
          </div>

          {/* 4 Statements Matrix */}
          <div className="space-y-3">
            {(question as TrueFalseQuestion).statements.map((st) => {
              const currentVal = tfAnswers[st.key];
              const isCorrectVal = currentVal?.toUpperCase() === st.answer.toUpperCase();

              return (
                <div
                  key={st.key}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 text-sm text-slate-200 flex-1">
                    <span className="font-bold text-emerald-400 uppercase text-xs pt-0.5">{st.key})</span>
                    <span>{st.statement}</span>
                  </div>

                  {/* True / False Toggle buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleTfSelect(st.key, 'Đ')}
                      disabled={tfSubmitted}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all ${
                        currentVal === 'Đ'
                          ? tfSubmitted
                            ? isCorrectVal
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-rose-500 text-white border-rose-400'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      ĐÚNG
                    </button>
                    <button
                      onClick={() => handleTfSelect(st.key, 'S')}
                      disabled={tfSubmitted}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all ${
                        currentVal === 'S'
                          ? tfSubmitted
                            ? isCorrectVal
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-rose-500 text-white border-rose-400'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      SAI
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!tfSubmitted && (
            <button
              onClick={handleTfSubmit}
              disabled={Object.keys(tfAnswers).length < (question as TrueFalseQuestion).statements.length}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg shadow-emerald-500/20"
            >
              Xác Nhận Đánh Giá 4 Ý
            </button>
          )}
        </div>
      )}

      {/* RENDER DẠNG 3: SHORT ANSWER / CALCULATION */}
      {question.type === 'short_answer' && (
        <div className="space-y-5">
          <h3 className="text-base sm:text-lg font-semibold text-slate-100 leading-relaxed">
            {(question as ShortAnswerQuestion).question}
          </h3>

          {(question as ShortAnswerQuestion).instruction && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{(question as ShortAnswerQuestion).instruction}</span>
            </div>
          )}

          <form onSubmit={handleSaSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={saInput}
                onChange={(e) => setSaInput(e.target.value)}
                disabled={saSubmitted}
                placeholder="Nhập số kết quả hoặc từ trả lời..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 text-sm font-medium"
              />
              <button
                type="submit"
                disabled={saSubmitted || !saInput.trim()}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <span>Kiểm tra</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {saSubmitted && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-400 block mb-0.5">Đáp án đúng trong dữ liệu:</span>
                <span className="font-bold text-emerald-400 text-base">{(question as ShortAnswerQuestion).answer}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXPLANATION / HƯỚNG DẪN LỜI GIẢI SECTION */}
      {((selectedMCQ || tfSubmitted || saSubmitted) || showExplanationDirectly) && (
        <div className="pt-4 border-t border-slate-800/80 animate-fade-in space-y-3">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center justify-between w-full text-xs font-bold text-emerald-400 hover:text-emerald-300 py-1"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Xem Lời Giải & Hướng Dẫn Tính</span>
            </div>
            {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showExplanation && (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
              <p className="font-semibold text-emerald-300">💡 Giải thích chi tiết:</p>
              <p>{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
