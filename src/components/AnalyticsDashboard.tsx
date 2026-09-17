import React from 'react';
import { UserStats, GradeLevel } from '../types/quiz';
import { BarChart3, Trophy, Target, Flame, RotateCcw, Award, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { resetAllProgress } from '../utils/storage';
import { sounds } from '../utils/audio';

interface AnalyticsDashboardProps {
  stats: UserStats;
  onStatsReset: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ stats, onStatsReset }) => {
  const globalAccuracy = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử và làm lại từ đầu không?')) {
      sounds.playClick();
      onStatsReset();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Questions Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Tổng Câu Đã Làm</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold font-heading text-slate-100">{stats.totalAnswered}</span>
            <p className="text-[11px] text-slate-400">Đúng {stats.totalCorrect} câu</p>
          </div>
        </div>

        {/* Global Accuracy Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Tỉ Lệ Chính Xác</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold font-heading text-teal-300">{globalAccuracy}%</span>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all" style={{ width: `${globalAccuracy}%` }}></div>
            </div>
          </div>
        </div>

        {/* Streak Days Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Chuỗi Học Tập</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold font-heading text-amber-400">{stats.streakDays} Ngày</span>
            <p className="text-[11px] text-slate-400">Duy trì học đều đặn mỗi ngày</p>
          </div>
        </div>

        {/* Saved & Wrong Question Counter */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Cần Ôn Lại</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold font-heading text-rose-400">{stats.wrongQuestionIds.length}</span>
            <p className="text-[11px] text-slate-400">{stats.bookmarkedQuestionIds.length} câu đã đánh dấu</p>
          </div>
        </div>
      </div>

      {/* Grade Accuracy Breakdown & Reset Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grade Breakdown (Left 2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Phân Tích Độ Chính Xác Theo Khối Lớp</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([6, 7, 8, 9] as GradeLevel[]).map((g) => {
              const gradeData = stats.gradeAccuracy[g] || { total: 0, correct: 0 };
              const acc = gradeData.total > 0 ? Math.round((gradeData.correct / gradeData.total) * 100) : 0;

              return (
                <div key={g} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">Lớp {g}</span>
                    <span className="font-bold text-emerald-400">{acc}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                      style={{ width: `${acc}%` }}
                    ></div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Đã làm: {gradeData.total} câu</span>
                    <span>Đúng: {gradeData.correct} câu</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset & Quick Settings Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Quản Lý Tiến Độ</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bạn có thể làm mới toàn bộ chuỗi ngày, điểm số thi thử và các câu trả lời bất kỳ lúc nào để ôn tập lại từ đầu.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl font-bold text-xs bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Xóa Lịch Sử & Làm Lại Từ Đầu</span>
          </button>
        </div>
      </div>

      {/* Exam Simulator History List */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
        <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Lịch Sử Thi Thử Gần Đây ({stats.examHistory.length})</span>
        </h3>

        {stats.examHistory.length > 0 ? (
          <div className="space-y-3">
            {stats.examHistory.map((exam) => (
              <div
                key={exam.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">Đề Thi Mô Phỏng Lớp {exam.grade}</span>
                    <span className="text-[10px] text-slate-400">({exam.date})</span>
                  </div>
                  <div className="text-slate-400">
                    Đúng {exam.correctAnswers} / {exam.totalQuestions} câu • {Math.round(exam.timeSpentSeconds / 60)} phút làm bài
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-bold font-heading text-amber-400 block">
                    {exam.score.toFixed(1)} / 10.0
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
            Chưa có kết quả thi thử nào. Hãy chuyển qua tab "Thi Thử Mô Phỏng" để thử sức ngay!
          </div>
        )}
      </div>
    </div>
  );
};
