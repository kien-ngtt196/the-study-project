import React from 'react';
import { ActiveTab } from '../types/quiz';
import { Home, BookOpen, Award, BarChart3, GraduationCap, Flame, Volume2, VolumeX, Sparkles, Swords, Smartphone } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  streakDays: number;
  onOpenStudentMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  soundEnabled,
  onToggleSound,
  streakDays,
  onOpenStudentMode,
}) => {

  const handleTabClick = (tab: ActiveTab) => {
    sounds.playClick();
    onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-50 vietnam-glass border-b border-[#D4AF37]/25 bg-[#0F3B46]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          
          {/* Brand Logo & Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleTabClick('home')}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#1B4D3E] via-[#0F3B46] to-[#D4AF37] p-0.5 shadow-lg shadow-[#D4AF37]/20 border border-[#D4AF37]/40 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#06181e] rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif-vn font-bold tracking-tight gradient-text-gold">
                  Lịch Sử & Địa Lý Việt Nam
                </h1>
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                  CT THCS 2026
                </span>
              </div>
              <p className="text-xs text-[#E8D8C8]/80 font-sans-vn hidden sm:block">
                Khám Phá Lịch Sử & Địa Lý Đất Nước Việt Nam qua 3 Dạng Thức Trắc Nghiệm
              </p>
            </div>
          </div>

          {/* Action Tools & Streak */}
          <div className="flex items-center gap-3">
            {/* Student Phone Mode Button */}
            {onOpenStudentMode && (
              <button
                onClick={onOpenStudentMode}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-[#1B4D3E]/30 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold hover:bg-[#D4AF37]/30 transition-all flex items-center gap-1.5"
                title="Mở màn hình điện thoại học sinh tham gia phòng"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden sm:inline">Vào Điện Thoại HS</span>
              </button>
            )}

            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold">
              <Flame className="w-4 h-4 fill-[#D4AF37] animate-bounce" />
              <span>{streakDays} Ngày Chuỗi</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-2 rounded-xl bg-[#06181e] border border-[#D4AF37]/30 text-[#E8D8C8]/70 hover:text-[#D4AF37] hover:border-[#D4AF37]/60 transition-all"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#D4AF37]" /> : <VolumeX className="w-4 h-4 text-[#E8D8C8]/40" />}
            </button>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-[#D4AF37]/15 no-scrollbar">
          <button
            onClick={() => handleTabClick('home')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-[#D4AF37]/25 to-[#1B4D3E]/60 text-[#D4AF37] border border-[#D4AF37]/50 shadow-sm'
                : 'text-[#E8D8C8]/70 hover:text-[#E8D8C8] hover:bg-[#0F3B46]/50'
            }`}
          >
            <Home className="w-4 h-4 text-[#D4AF37]" />
            <span>Trang Chủ</span>
          </button>

          <button
            onClick={() => handleTabClick('study')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'study'
                ? 'bg-[#1B4D3E]/70 text-[#E8D8C8] border border-[#D4AF37]/40 shadow-sm'
                : 'text-[#E8D8C8]/70 hover:text-[#E8D8C8] hover:bg-[#0F3B46]/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            <span>Ôn Luyện Theo Bài</span>
          </button>

          <button
            onClick={() => handleTabClick('exam')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'exam'
                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 shadow-sm'
                : 'text-[#E8D8C8]/70 hover:text-[#E8D8C8] hover:bg-[#0F3B46]/50'
            }`}
          >
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span>Thi Thử Mô Phỏng 2026</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
            </span>
          </button>

          <button
            onClick={() => handleTabClick('game')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'game'
                ? 'bg-[#1B4D3E] text-[#D4AF37] border border-[#D4AF37]/50 shadow-sm'
                : 'text-[#E8D8C8]/70 hover:text-[#E8D8C8] hover:bg-[#0F3B46]/50'
            }`}
          >
            <Swords className="w-4 h-4 text-[#D4AF37]" />
            <span>Đấu Trường Trò Chơi (Giáo Viên)</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">Mới</span>
          </button>

          <button
            onClick={() => handleTabClick('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'analytics'
                ? 'bg-[#1B4D3E]/60 text-[#E8D8C8] border border-[#D4AF37]/40 shadow-sm'
                : 'text-[#E8D8C8]/70 hover:text-[#E8D8C8] hover:bg-[#0F3B46]/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
            <span>Báo Cáo & Tiến Độ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
