import React, { useState, useEffect, useMemo } from 'react';
import { GRADE_LEVELS, GradeLevel, LessonTopic, QuestionItem, MCQQuestion, TrueFalseQuestion, ShortAnswerQuestion, ExamResult } from '../types/quiz';
import { Award, Clock, AlertTriangle, CheckCircle2, Flag, Send, RotateCcw, Trophy, FileText, ChevronRight, HelpCircle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ExamModeProps {
  grade: GradeLevel;
  topics: LessonTopic[];
  onFinishExam: (result: ExamResult) => void;
  onSelectGrade?: (grade: GradeLevel) => void;
}

export const ExamMode: React.FC<ExamModeProps> = ({ grade, topics, onFinishExam, onSelectGrade }) => {
  // Exam State: 'idle' | 'running' | 'submitted'
  const [examStatus, setExamStatus] = useState<'idle' | 'running' | 'submitted'>('idle');

  // Random sampled exam questions
  const [examQuestions, setExamQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // User responses
  // mcqResponses: qId -> optLetter ('A', 'B', 'C', 'D')
  const [mcqResponses, setMcqResponses] = useState<Record<string, string>>({});

  // tfResponses: qId -> { a: 'Đ', b: 'S', ... }
  const [tfResponses, setTfResponses] = useState<Record<string, Record<string, string>>>({});

  // saResponses: qId -> userTextInput
  const [saResponses, setSaResponses] = useState<Record<string, string>>({});

  // Flagged questions
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);

  // Timer (45 minutes = 2700 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(2700);

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Calculated Score
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  // Generate random exam session
  const startExam = () => {
    sounds.playClick();
    let mcqPool: MCQQuestion[] = [];
    let tfPool: TrueFalseQuestion[] = [];
    let saPool: ShortAnswerQuestion[] = [];

    topics.forEach((t) => {
      mcqPool.push(...t.mcq_questions);
      tfPool.push(...t.tf_questions);
      saPool.push(...t.sa_questions);
    });

    // Shuffle helper
    const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

    // Pick 12 MCQs, 4 True/False, 4 Short Answers
    const sampledMCQ = shuffle(mcqPool).slice(0, 12);
    const sampledTF = shuffle(tfPool).slice(0, 4);
    const sampledSA = shuffle(saPool).slice(0, 4);

    const fullExamList: QuestionItem[] = [...sampledMCQ, ...sampledTF, ...sampledSA];

    setExamQuestions(fullExamList);
    setMcqResponses({});
    setTfResponses({});
    setSaResponses({});
    setFlaggedIds([]);
    setTimeLeft(2700);
    setCurrentIndex(0);
    setExamStatus('running');
    setExamResult(null);
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (examStatus !== 'running') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam(); // Auto submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examStatus]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle flag
  const toggleFlag = (qId: string) => {
    sounds.playClick();
    setFlaggedIds((prev) => (prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]));
  };

  // Submit Exam & Calculate Official Score
  const handleSubmitExam = () => {
    let totalScore = 0;
    let mcqScore = 0;
    let tfScore = 0;
    let saScore = 0;
    let correctCount = 0;

    examQuestions.forEach((q) => {
      if (q.type === 'mcq') {
        const userAns = mcqResponses[q.id];
        if (userAns && userAns === q.answer) {
          mcqScore += 0.25;
          correctCount += 1;
        }
      } else if (q.type === 'true_false') {
        const userTf = tfResponses[q.id] || {};
        let subCorrect = 0;
        q.statements.forEach((st) => {
          if (userTf[st.key] && userTf[st.key].toUpperCase() === st.answer.toUpperCase()) {
            subCorrect += 1;
          }
        });
        // Official non-linear grading
        if (subCorrect === 1) tfScore += 0.1;
        else if (subCorrect === 2) tfScore += 0.25;
        else if (subCorrect === 3) tfScore += 0.5;
        else if (subCorrect === 4) {
          tfScore += 1.0;
          correctCount += 1;
        }
      } else if (q.type === 'short_answer') {
        const userSa = (saResponses[q.id] || '').trim().replace(',', '.').toLowerCase();
        const correctSa = q.answer.trim().replace(',', '.').toLowerCase();

        const numUser = parseFloat(userSa);
        const numAns = parseFloat(correctSa);

        let isCorrect = userSa === correctSa;
        if (!isNaN(numUser) && !isNaN(numAns)) {
          isCorrect = Math.abs(numUser - numAns) < 0.15;
        }

        if (isCorrect) {
          saScore += 0.25;
          correctCount += 1;
        }
      }
    });

    totalScore = Math.min(10.0, Math.round((mcqScore + tfScore + saScore) * 100) / 100);

    const resultObj: ExamResult = {
      id: `exam_${Date.now()}`,
      date: new Date().toLocaleDateString('vi-VN'),
      grade,
      score: totalScore,
      totalQuestions: examQuestions.length,
      correctAnswers: correctCount,
      timeSpentSeconds: 2700 - timeLeft,
      detailScores: {
        mcqScore,
        tfScore,
        saScore,
      },
    };

    setExamResult(resultObj);
    setExamStatus('submitted');
    setShowSubmitModal(false);
    onFinishExam(resultObj);

    if (totalScore >= 8.0) {
      sounds.playCorrect();
      sounds.triggerConfetti();
    } else {
      sounds.playClick();
    }
  };

  const currentQ = examQuestions[currentIndex];

  // Helper check if question answered
  const isQuestionAnswered = (q: QuestionItem) => {
    if (q.type === 'mcq') return !!mcqResponses[q.id];
    if (q.type === 'true_false') {
      const resp = tfResponses[q.id];
      return resp && Object.keys(resp).length === q.statements.length;
    }
    if (q.type === 'short_answer') return !!(saResponses[q.id] || '').trim();
    return false;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* IDLE STATE: START EXAM SCREEN */}
      {examStatus === 'idle' && (
        <div className="vietnam-glass rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/35 max-w-4xl mx-auto shadow-2xl relative overflow-hidden space-y-6">
          
          {/* Hero Banner with Ha Long Bay Artwork */}
          <div className="relative overflow-hidden rounded-2xl h-48 sm:h-56 border border-[#D4AF37]/30 shadow-lg group">
            <img
              src="/images/halong_bay.jpg"
              alt="Hạ Long Bay"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#051419] via-[#051419]/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#051419] via-transparent to-transparent"></div>

            <div className="relative z-10 h-full flex flex-col justify-end p-6 max-w-xl">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 w-fit backdrop-blur-md">
                  Mô Phỏng Kỳ Thi Kỳ 2026
                </span>
                
                {onSelectGrade && (
                  <div className="flex items-center gap-1 p-0.5 bg-[#06181e]/90 rounded-lg border border-[#D4AF37]/40 backdrop-blur-md">
                    {GRADE_LEVELS.map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          sounds.playClick();
                          onSelectGrade(g);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          grade === g
                            ? 'bg-[#D4AF37] text-[#051419]'
                            : 'text-[#E8D8C8]/70 hover:text-white'
                        }`}
                      >
                        Lớp {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif-vn font-bold text-white tracking-wide gradient-text-gold">
                Thi Thử Mô Phỏng Chuẩn 2026 - Lớp {grade}
              </h2>
              <p className="text-xs text-[#E8D8C8]/90 font-sans-vn mt-1">
                Đề thi ngẫu nhiên gồm đầy đủ 3 dạng thức trắc nghiệm với thang điểm không tuyến tính chính thức.
              </p>
            </div>
          </div>

          {/* Exam Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl bg-[#051419]/90 border border-[#D4AF37]/25">
              <span className="text-xs text-[#E8D8C8]/70 block font-medium">Thời gian làm bài</span>
              <span className="text-xl font-serif-vn font-bold text-[#D4AF37]">45 Phút</span>
            </div>
            <div className="p-4 rounded-xl bg-[#051419]/90 border border-[#D4AF37]/25">
              <span className="text-xs text-[#E8D8C8]/70 block font-medium">Số lượng câu hỏi</span>
              <span className="text-xl font-serif-vn font-bold text-[#E8D8C8]">20 Câu / 3 Dạng</span>
            </div>
            <div className="p-4 rounded-xl bg-[#051419]/90 border border-[#D4AF37]/25">
              <span className="text-xs text-[#E8D8C8]/70 block font-medium">Thang điểm chuẩn</span>
              <span className="text-xl font-serif-vn font-bold text-[#D4AF37]">10.0 Điểm</span>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={startExam}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-[#1B4D3E] via-[#0F3B46] to-[#D4AF37] text-[#D4AF37] border border-[#D4AF37]/50 shadow-xl shadow-[#D4AF37]/20 btn-emil-spring"
            >
              Bắt Đầu Làm Bài Thi Ngay
            </button>
          </div>
        </div>
      )}

      {/* RUNNING STATE: EXAM SIMULATOR */}
      {examStatus === 'running' && currentQ && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Question Panel (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
              
              {/* Question Top Controls */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                    Câu {currentIndex + 1} / {examQuestions.length}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                    {currentQ.type === 'mcq' && 'Dạng 1: Trắc nghiệm 4 đáp án'}
                    {currentQ.type === 'true_false' && 'Dạng 2: Đúng / Sai 4 ý'}
                    {currentQ.type === 'short_answer' && 'Dạng 3: Trả lời ngắn'}
                  </span>
                </div>

                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    flaggedIds.includes(currentQ.id)
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedIds.includes(currentQ.id) ? 'Đã Đặt Cờ' : 'Đặt Cờ Xem Lại'}</span>
                </button>
              </div>

              {/* RENDER EXAM QUESTION CONTENT */}
              {currentQ.type === 'mcq' && (
                <div className="space-y-5">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-100 leading-relaxed">
                    {(currentQ as MCQQuestion).question}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {(currentQ as MCQQuestion).options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isSelected = mcqResponses[currentQ.id] === letter;
                      return (
                        <button
                          key={letter}
                          onClick={() => {
                            sounds.playClick();
                            setMcqResponses((prev) => ({ ...prev, [currentQ.id]: letter }));
                          }}
                          className={`w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-sm pt-0.5">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentQ.type === 'true_false' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm leading-relaxed">
                    <span className="text-xs uppercase font-bold text-amber-400 block mb-1">Ngữ liệu bài thi:</span>
                    {(currentQ as TrueFalseQuestion).context}
                  </div>

                  <div className="space-y-3">
                    {(currentQ as TrueFalseQuestion).statements.map((st) => {
                      const currentVal = (tfResponses[currentQ.id] || {})[st.key];
                      return (
                        <div key={st.key} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
                          <div className="text-sm text-slate-200 flex-1">
                            <span className="font-bold text-amber-400 mr-2">{st.key})</span>
                            {st.statement}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                sounds.playClick();
                                setTfResponses((prev) => ({
                                  ...prev,
                                  [currentQ.id]: { ...(prev[currentQ.id] || {}), [st.key]: 'Đ' },
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs border ${
                                currentVal === 'Đ' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              ĐÚNG
                            </button>
                            <button
                              onClick={() => {
                                sounds.playClick();
                                setTfResponses((prev) => ({
                                  ...prev,
                                  [currentQ.id]: { ...(prev[currentQ.id] || {}), [st.key]: 'S' },
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs border ${
                                currentVal === 'S' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              SAI
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentQ.type === 'short_answer' && (
                <div className="space-y-5">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-100">
                    {(currentQ as ShortAnswerQuestion).question}
                  </h3>
                  {(currentQ as ShortAnswerQuestion).instruction && (
                    <p className="text-xs text-amber-300 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      💡 {(currentQ as ShortAnswerQuestion).instruction}
                    </p>
                  )}
                  <input
                    type="text"
                    value={saResponses[currentQ.id] || ''}
                    onChange={(e) =>
                      setSaResponses((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                    }
                    placeholder="Nhập kết quả trả lời của bạn vào đây..."
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-sm font-medium"
                  />
                </div>
              )}

              {/* Prev / Next controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
                  }}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-slate-300 border border-slate-800 disabled:opacity-30"
                >
                  ← Câu Trước
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    if (currentIndex < examQuestions.length - 1) setCurrentIndex((prev) => prev + 1);
                  }}
                  disabled={currentIndex === examQuestions.length - 1}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-30 flex items-center gap-1.5"
                >
                  <span>Câu Tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Timer & Question Matrix */}
          <div className="space-y-4">
            
            {/* Timer Card */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-xs text-slate-400 font-semibold uppercase">Thời Gian Còn Lại</span>
              </div>
              <span className="text-xl font-bold font-heading text-amber-400 tracking-wider">
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Question Grid Matrix */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Ma Trận Câu Hỏi ({examQuestions.length})
                </h4>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {examQuestions.map((q, idx) => {
                  const isAns = isQuestionAnswered(q);
                  const isFlag = flaggedIds.includes(q.id);
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        sounds.playClick();
                        setCurrentIndex(idx);
                      }}
                      className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center relative border transition-all ${
                        isCurrent
                          ? 'border-amber-400 ring-2 ring-amber-400/30 font-extrabold scale-105'
                          : ''
                      } ${
                        isAns
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlag && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Matrix Legend */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-around">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500"></span>
                  <span>Đã làm</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700"></span>
                  <span>Chưa làm</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
                  <span>Cờ</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Nộp Bài Thi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-800 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-100 font-heading">Xác Nhận Nộp Bài Thi?</h3>
              <p className="text-xs text-slate-400">
                Bạn đã trả lời {examQuestions.filter(isQuestionAnswered).length} / {examQuestions.length} câu hỏi.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
              >
                Quay Lại Làm Tiếp
              </button>
              <button
                onClick={handleSubmitExam}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
              >
                Nộp Bài Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMITTED STATE: POST-EXAM SCORECARD */}
      {examStatus === 'submitted' && examResult && (
        <div className="space-y-6">
          {/* Scorecard Hero */}
          <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 mx-auto shadow-xl shadow-emerald-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-emerald-400">
                <Trophy className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Kết Quả Bài Thi Mô Phỏng Lớp {grade}
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold font-heading text-slate-100 pt-2">
                {examResult.score.toFixed(1)} / 10.0 Điểm
              </h2>
              <p className="text-sm text-slate-400">
                Đúng {examResult.correctAnswers} / {examResult.totalQuestions} câu • Thời gian: {formatTime(examResult.timeSpentSeconds)}
              </p>
            </div>

            {/* Detail Score Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 text-left">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-medium">Dạng 1 (Nhiều lựa chọn)</span>
                <span className="text-lg font-bold text-emerald-400 font-heading">
                  {examResult.detailScores.mcqScore.toFixed(2)} / 3.0 điểm
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-medium">Dạng 2 (Đúng / Sai 4 ý)</span>
                <span className="text-lg font-bold text-amber-400 font-heading">
                  {examResult.detailScores.tfScore.toFixed(2)} / 4.0 điểm
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-medium">Dạng 3 (Trả lời ngắn)</span>
                <span className="text-lg font-bold text-cyan-400 font-heading">
                  {examResult.detailScores.saScore.toFixed(2)} / 1.0 điểm
                </span>
              </div>
            </div>

            <button
              onClick={() => setExamStatus('idle')}
              className="px-8 py-3 rounded-xl font-bold text-xs bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thi Thử Đề Khác</span>
            </button>
          </div>

          {/* Full Review List */}
          <div className="space-y-4">
            <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Xem Lại Lời Giải Chi Tiết Các Câu Hỏi</span>
            </h3>

            {examQuestions.map((q, idx) => (
              <div key={q.id} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                  <span className="font-bold text-emerald-400">Câu {idx + 1}</span>
                  <span className="text-slate-400">{q.difficulty}</span>
                </div>

                {q.type === 'mcq' && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-200">{q.question}</p>
                    <p className="text-xs text-emerald-400 font-bold">Đáp án đúng: {q.answer}</p>
                    <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">{q.explanation}</p>
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 font-medium bg-slate-900 p-3 rounded-xl border border-slate-800">{q.context}</p>
                    <div className="space-y-2">
                      {q.statements.map((st) => (
                        <div key={st.key} className="text-xs flex items-center justify-between p-2 rounded bg-slate-900/50">
                          <span>{st.key}) {st.statement}</span>
                          <span className="font-bold text-amber-400">{st.answer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-200">{q.question}</p>
                    <p className="text-xs text-emerald-400 font-bold">Đáp án đúng: {q.answer}</p>
                    <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
