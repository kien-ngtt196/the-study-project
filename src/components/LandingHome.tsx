import React from 'react';
import { GradeLevel, ActiveTab } from '../types/quiz';
import { 
  BookOpen, 
  Award, 
  Swords, 
  Sparkles, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Compass, 
  Flame, 
  ShieldCheck, 
  Smartphone,
  MapPin,
  Layers,
  Zap,
  Globe2,
  Clock
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface LandingHomeProps {
  activeGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenStudentMode: () => void;
  totalAnswered: number;
  streakDays: number;
}

export const LandingHome: React.FC<LandingHomeProps> = ({
  activeGrade,
  onSelectGrade,
  onSelectTab,
  onOpenStudentMode,
  totalAnswered,
  streakDays,
}) => {
  const handleTabNavigate = (tab: ActiveTab) => {
    sounds.playClick();
    onSelectTab(tab);
  };

  const handleGradeNavigate = (grade: GradeLevel) => {
    sounds.playClick();
    onSelectGrade(grade);
    onSelectTab('study');
  };

  return (
    <div className="space-y-16 animate-fade-in pb-16">
      
      {/* ========================================================================= */}
      {/* 1. ATTENTION: WIDE CINEMATIC HERO (GPT-TASTE 2-LINE TYPOGRAPHY RULE)      */}
      {/* ========================================================================= */}
      <section className="relative rounded-3xl overflow-hidden border border-[#D4AF37]/35 shadow-2xl min-h-[480px] flex items-center bg-[#051419]">
        {/* Background Scenery & Ambient Radial Mesh Glow */}
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000 opacity-60"
          style={{ backgroundImage: `url('/images/vietnam_hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#051419] via-[#051419]/90 to-[#0F3B46]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_var(--tw-gradient-stops))] from-[#D4AF37]/25 via-transparent to-transparent pointer-events-none" />

        {/* Hero Content - Ultra-wide max-w-5xl for clean 2-line flow */}
        <div className="relative z-10 p-6 sm:p-12 lg:p-16 max-w-5xl space-y-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#D4AF37] text-xs font-bold font-sans-vn backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#D4AF37]" />
            <span>Nền Tảng Ôn Thi & Thi Đấu Lịch Sử & Địa Lý THCS 2026</span>
          </div>

          {/* 2-line wide hero title per gpt-taste rule */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif-vn font-extrabold text-white leading-[1.1] tracking-tight">
            Khám Phá Sắc Màu <br />
            <span className="gradient-text-gold">Lịch Sử & Địa Lý Việt Nam</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[#E8D8C8]/90 font-sans-vn leading-relaxed max-w-3xl">
            Tích hợp trọn bộ ma trận 3 dạng thức trắc nghiệm phân hóa chuẩn Bộ GD&ĐT: Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai đa ý và Câu hỏi Điền số ngắn. Học tập chủ động, thi đấu trực tiếp trên lớp học.
          </p>

          {/* High-contrast Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              onClick={() => handleTabNavigate('study')}
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#051419] font-extrabold text-sm sm:text-base btn-emil-spring shadow-xl shadow-[#D4AF37]/20 flex items-center gap-2.5 border border-[#FDE68A]"
            >
              <BookOpen className="w-5 h-5 text-[#051419]" />
              <span>Bắt Đầu Ôn Luyện</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleTabNavigate('game')}
              className="px-7 py-4 rounded-2xl bg-[#06181e]/90 text-[#D4AF37] font-bold text-sm sm:text-base btn-emil-press border border-[#D4AF37]/50 hover:bg-[#1B4D3E]/60 flex items-center gap-2.5 shadow-lg"
            >
              <Swords className="w-5 h-5 text-[#D4AF37]" />
              <span>Đấu Trường Trò Chơi (QR Code)</span>
            </button>
          </div>

          {/* Quick Stats Badges Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-[#D4AF37]/20 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-white font-sans-vn">Đủ 4 Khối Lớp</div>
                <div className="text-[11px] text-[#E8D8C8]/70">Lớp 6, 7, 8, 9</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1B4D3E]/30 border border-[#52B788]/40 flex items-center justify-center text-[#52B788] shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-white font-sans-vn">3 Dạng Thức 2026</div>
                <div className="text-[11px] text-[#E8D8C8]/70">MCQ, Đúng/Sai, Điền Số</div>
              </div>
            </div>

            <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="w-9 h-9 rounded-xl bg-[#0F3B46]/50 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-white font-sans-vn">Chuỗi {streakDays} Ngày</div>
                <div className="text-[11px] text-[#E8D8C8]/70">Đã trả lời {totalAnswered} câu</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. INTEREST: GAPLESS BENTO GRID SHOWCASE (GPT-TASTE RULE)                */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-sans-vn">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              <span>Hệ Thống Tính Năng Học Tập</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif-vn font-bold text-white">
              Nền Tảng Đột Phá Môn Lịch Sử & Địa Lý
            </h2>
          </div>
        </div>

        {/* Gapless Bento Grid with grid-flow-dense */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 grid-flow-dense">
          
          {/* Bento Card 1 (Featured 2-column wide card) */}
          <div 
            onClick={() => handleTabNavigate('study')}
            className="md:col-span-2 vietnam-glass rounded-3xl p-8 border border-[#D4AF37]/35 hover:border-[#D4AF37]/70 transition-all cursor-pointer group relative overflow-hidden space-y-5 shadow-xl"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-25 transition-opacity duration-700"
              style={{ backgroundImage: `url('/images/halong_bay.jpg')` }}
            />
            <div className="relative z-10 flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-[#1B4D3E]/50 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold">
                Luyện Tập Theo Bài
              </span>
            </div>

            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl font-bold text-white font-serif-vn group-hover:text-[#D4AF37] transition-colors">
                Ngân Hàng Câu Hỏi Lịch Sử & Địa Lý Phân Hóa
              </h3>
              <p className="text-sm text-[#E8D8C8]/85 font-sans-vn leading-relaxed max-w-2xl">
                Từng bài học được biên soạn kĩ lưỡng theo chương trình SGK mới Lớp 6, 7, 8, 9. Tích hợp giải thích chi tiết, gợi ý kiến thức và lưu trữ các câu hỏi chưa đúng để rèn luyện lại.
              </p>
            </div>

            <div className="relative z-10 inline-flex items-center gap-2 text-xs font-extrabold text-[#D4AF37] group-hover:translate-x-1.5 transition-transform">
              <span>Bắt đầu ôn luyện từng bài học</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Bento Card 2: Simulated Exam */}
          <div 
            onClick={() => handleTabNavigate('exam')}
            className="vietnam-glass rounded-3xl p-7 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all cursor-pointer group space-y-4 shadow-lg flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#0F3B46]/60 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#38BDF8] text-[10px] font-bold">
                Chấm 0.25đ
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-serif-vn group-hover:text-[#D4AF37] transition-colors">
                Thi Thử 45 Phút Chuẩn 2026
              </h3>
              <p className="text-xs text-[#E8D8C8]/80 font-sans-vn leading-relaxed">
                Thi thử bấm giờ ngẫu nhiên 20 câu hỏi. Áp dụng quy tắc chấm điểm không tuyến tính chuẩn Bộ GD&ĐT cho câu hỏi Đúng/Sai đa ý.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#38BDF8] group-hover:translate-x-1 transition-transform">
              <span>Vào phòng thi ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bento Card 3: Classroom Game Arena */}
          <div 
            onClick={() => handleTabNavigate('game')}
            className="vietnam-glass rounded-3xl p-7 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all cursor-pointer group space-y-4 shadow-lg flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform">
                <Swords className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold">
                Trực Tiếp
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-serif-vn group-hover:text-[#D4AF37] transition-colors">
                Đấu Trường Lớp Học (QR Code)
              </h3>
              <p className="text-xs text-[#E8D8C8]/80 font-sans-vn leading-relaxed">
                Giáo viên chiếu máy chiếu, học sinh quét mã QR chọn đội linh thú (Trâu Vàng, Chim Lạc, Sao La, Voọc Quần Đùi) và thi đua điểm số trên đường đua trực quan.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] group-hover:translate-x-1 transition-transform">
              <span>Tạo phòng đấu trường</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bento Card 5: Analytics */}
          <div 
            onClick={() => handleTabNavigate('analytics')}
            className="vietnam-glass rounded-3xl p-7 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all cursor-pointer group space-y-4 shadow-lg flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#0F3B46]/50 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-serif-vn group-hover:text-[#D4AF37] transition-colors">
                Báo Cáo Tiến Độ & Streak
              </h3>
              <p className="text-xs text-[#E8D8C8]/80 font-sans-vn leading-relaxed">
                Theo dõi chính xác tỉ lệ đúng từng khối lớp, xem lại ngân hàng câu hỏi làm sai và duy trì chuỗi học tập đều đặn hàng ngày.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#38BDF8] group-hover:translate-x-1 transition-transform">
              <span>Xem báo cáo chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. DESIRE: GRADE LEVEL CURRICULUM SELECTOR                                */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-sans-vn">
              <Compass className="w-4 h-4 text-[#D4AF37]" />
              <span>Chương Trình Các Khối Lớp THCS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-vn font-bold text-white">
              Chọn Khối Lớp Để Bắt Đầu Học
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { grade: 6, title: 'Lịch Sử & Địa Lý 6', desc: 'Trái Đất, Bản đồ, Khái quát Địa lý Tự nhiên & Lịch sử Cổ đại', color: 'from-[#1B4D3E] to-[#0F3B46]' },
            { grade: 7, title: 'Lịch Sử & Địa Lý 7', desc: 'Địa lý các Châu lục & Lịch sử Việt Nam thời Phong kiến (thế kỷ X-XVI)', color: 'from-[#0F3B46] to-[#1E3A8A]' },
            { grade: 8, title: 'Lịch Sử & Địa Lý 8', desc: 'Tự nhiên Việt Nam, Biển Đông, Thổ nhưỡng & Lịch sử thời Nguyễn', color: 'from-[#1B4D3E] to-[#D4AF37]/30' },
            { grade: 9, title: 'Lịch Sử & Địa Lý 9', desc: 'Địa lý Kinh tế - Xã hội Việt Nam & Lịch sử Việt Nam Hiện đại', color: 'from-[#D4AF37]/20 to-[#1B4D3E]' },
          ].map((item) => {
            const isSelected = activeGrade === item.grade;
            return (
              <button
                key={item.grade}
                onClick={() => handleGradeNavigate(item.grade as GradeLevel)}
                className={`p-6 rounded-3xl text-left border transition-all duration-300 btn-emil-spring flex flex-col justify-between min-h-[220px] ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#1B4D3E] to-[#0F3B46] border-[#D4AF37] shadow-xl shadow-[#D4AF37]/20 ring-2 ring-[#D4AF37]/40'
                    : 'vietnam-glass border-[#D4AF37]/25 hover:border-[#D4AF37]/60 hover:bg-[#0F3B46]/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-extrabold font-sans-vn">
                      Lớp {item.grade}
                    </span>
                    {isSelected && (
                      <span className="text-xs font-bold text-[#52B788] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đang chọn
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white font-serif-vn mb-2">{item.title}</h3>
                  <p className="text-xs text-[#E8D8C8]/80 font-sans-vn leading-relaxed">{item.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs font-extrabold text-[#D4AF37]">
                  <span>Vào Ôn Luyện Lớp {item.grade}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. ACTION: HERITAGE GALLERY BANNER & STUDENT MOBILE ACCESS                */}
      {/* ========================================================================= */}
      <section className="rounded-3xl p-8 sm:p-10 border border-[#D4AF37]/35 bg-gradient-to-r from-[#06181e] via-[#0F3B46]/60 to-[#1B4D3E]/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="space-y-4 max-w-xl z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-sans-vn">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <span>Di Sản & Tình Yêu Quê Hương Đất Nước</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif-vn font-bold text-white leading-snug">
            Trải Nghiệm Học Tập Tương Tác Sinh Động Trực Tiếp Trên Lớp
          </h3>
          <p className="text-xs sm:text-sm text-[#E8D8C8]/85 font-sans-vn leading-relaxed">
            Môn Lịch Sử & Địa Lý không chỉ cung cấp tri thức trắc nghiệm, mà còn truyền cảm hứng tự hào dân tộc. Học sinh sử dụng điện thoại cá nhân kết nối vào phòng thi đấu trực tiếp cùng bạn bè.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 z-10 w-full md:w-auto">
          <button
            onClick={onOpenStudentMode}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#051419] font-extrabold text-sm btn-emil-spring flex items-center justify-center gap-2.5 shadow-xl shadow-[#D4AF37]/20 border border-[#FDE68A]"
          >
            <Smartphone className="w-5 h-5 text-[#051419]" />
            <span>Màn Hình Điện Thoại Học Sinh</span>
          </button>
        </div>
      </section>

    </div>
  );
};
