import React, { useState, useEffect } from 'react';
import { mpNetwork, NetworkMessage } from '../utils/multiplayer';
import { Smartphone, Users, CheckCircle2, XCircle, Send, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { sounds } from '../utils/audio';

interface StudentMobileViewProps {
  initialPin?: string;
  onExit?: () => void;
}

export const StudentMobileView: React.FC<StudentMobileViewProps> = ({ initialPin = '', onExit }) => {
  const [pin, setPin] = useState<string>(initialPin);
  const [name, setName] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('t1');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Game state on phone
  const [gameState, setGameState] = useState<'lobby' | 'answering' | 'submitted' | 'result'>('lobby');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState<string>('');
  const [tfSubAnswers, setTfSubAnswers] = useState<Record<string, string>>({});
  const [saInputVal, setSaInputVal] = useState<string>('');

  // Scores on student phone
  const [personalScore, setPersonalScore] = useState<number>(0);
  const [teamScores, setTeamScores] = useState<Record<string, number>>({});

  // Parse teams query parameter from QR code URL if present
  const [initialNumTeams] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('teams');
      if (p) {
        const parsed = parseInt(p, 10);
        if ([2, 3, 4].includes(parsed)) return parsed;
      }
    }
    return 2;
  });

  const ALL_TEAMS = [
    { id: 't1', name: 'Đội Trâu Vàng 🐃', color: 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]' },
    { id: 't2', name: 'Đội Chim Lạc 🦅', color: 'bg-[#0F3B46]/50 border-[#38BDF8]/40 text-[#38BDF8]' },
    { id: 't3', name: 'Đội Sao La 🦌', color: 'bg-[#F43F5E]/20 border-[#F43F5E]/50 text-[#F43F5E]' },
    { id: 't4', name: 'Đội Voọc Quần Đùi 🐒', color: 'bg-[#A855F7]/20 border-[#A855F7]/50 text-[#A855F7]' },
  ];

  // Dynamic active teams from teacher host
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string; color: string }>>(() => {
    return ALL_TEAMS.slice(0, initialNumTeams);
  });

  // Result state
  const [resultInfo, setResultInfo] = useState<{ isCorrect: boolean; pointsEarned: number; correctAnswer: string; explanation: string } | null>(null);

  useEffect(() => {
    mpNetwork.onGameStateChange = (msg) => {
      if (msg.activeTeams && msg.activeTeams.length > 0) {
        const activeIds = msg.activeTeams.map(t => t.id);
        setAvailableTeams(msg.activeTeams.map(t => ({
          id: t.id,
          name: t.name,
          color: t.id === 't1' ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]'
               : t.id === 't2' ? 'bg-[#0F3B46]/50 border-[#38BDF8]/40 text-[#38BDF8]'
               : t.id === 't3' ? 'bg-[#F43F5E]/20 border-[#F43F5E]/50 text-[#F43F5E]'
               : 'bg-[#A855F7]/20 border-[#A855F7]/50 text-[#A855F7]'
        })));

        // Ensure student selectedTeam is valid for current room
        setSelectedTeam((current) => {
          return activeIds.includes(current) ? current : activeIds[0];
        });

        const scoresMap: Record<string, number> = {};
        msg.activeTeams.forEach(t => { scoresMap[t.id] = t.score; });
        setTeamScores(prev => ({ ...prev, ...scoresMap }));
      }

      if (msg.state === 'playing' && msg.question) {
        setCurrentQuestion(msg.question);
        setSubmittedAnswer('');
        setTfSubAnswers({});
        setSaInputVal('');
        setResultInfo(null);
        setGameState('answering');
        sounds.playClick();
      } else if (msg.state === 'lobby') {
        setGameState('lobby');
      }
    };


    mpNetwork.onRevealResult = (msg) => {
      setResultInfo({
        isCorrect: msg.isCorrect,
        pointsEarned: msg.pointsEarned,
        correctAnswer: msg.correctAnswer,
        explanation: msg.explanation,
      });

      if (msg.pointsEarned > 0) {
        setPersonalScore((prev) => prev + msg.pointsEarned);
      }

      if (msg.teamScores) {
        setTeamScores(msg.teamScores);
      }

      setGameState('result');
      if (msg.isCorrect) {
        sounds.playCorrect();
        sounds.triggerConfetti();
      } else {
        sounds.playIncorrect();
      }
    };

    mpNetwork.onError = (err) => {
      setErrorMessage(err);
      setIsConnecting(false);
    };

    return () => {
      mpNetwork.onGameStateChange = undefined;
      mpNetwork.onRevealResult = undefined;
      mpNetwork.onError = undefined;
    };
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || !name.trim()) return;
    sounds.playClick();
    setIsConnecting(true);
    setErrorMessage('');

    try {
      await mpNetwork.joinRoom(pin.trim(), name.trim(), selectedTeam);
      setIsConnecting(false);
      setIsJoined(true);
    } catch (err: any) {
      setIsConnecting(false);
      setErrorMessage(err?.message || 'Không thể kết nối! Kiểm tra lại Mã Phòng.');
    }
  };

  const handleSendAnswer = (ansLetter: string) => {
    if (gameState !== 'answering') return;
    sounds.playClick();
    setSubmittedAnswer(ansLetter);
    setGameState('submitted');
    mpNetwork.sendAnswer(ansLetter, 10);
  };

  const teams = availableTeams;

  return (
    <div className="min-h-screen bg-[#051419] text-[#E8D8C8] flex flex-col justify-center items-center p-4">
      
      {/* 1. JOIN ROOM FORM */}
      {!isJoined && (
        <div className="vietnam-glass rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-[#D4AF37]/35 space-y-6 shadow-2xl animate-fade-in text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#06181e] border border-[#D4AF37]/40 p-0.5 mx-auto shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
            <Smartphone className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-2xl font-serif-vn font-bold text-white gradient-text-gold">Tham Gia Trò Chơi</h2>
            <p className="text-xs text-[#E8D8C8]/80 font-sans-vn mt-1">Nhập Mã Phòng do Cô Giáo cung cấp để thi đấu trên điện thoại</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-serif-vn font-bold text-[#D4AF37] block mb-1 uppercase tracking-wider">Mã Phòng (6 Chữ Số)</label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="VD: 582910"
                className="w-full px-4 py-3 rounded-xl bg-[#06181e] border border-[#D4AF37]/35 text-center text-xl font-extrabold font-mono tracking-widest text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-xs font-serif-vn font-bold text-[#D4AF37] block mb-1 uppercase tracking-wider">Tên Học Sinh / Biệt Danh</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="w-full px-4 py-3 rounded-xl bg-[#06181e] border border-[#D4AF37]/35 text-xs text-[#E8D8C8] focus:outline-none focus:border-[#D4AF37] font-medium font-sans-vn"
              />
            </div>

            <div>
              <label className="text-xs font-serif-vn font-bold text-[#D4AF37] block mb-1 uppercase tracking-wider">Chọn Đội Thi Đấu</label>
              <div className="grid grid-cols-2 gap-2">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedTeam(t.id);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all btn-emil-press ${
                      selectedTeam === t.id ? `${t.color} ring-2 ring-[#D4AF37]` : 'bg-[#06181e] text-[#E8D8C8]/60 border-[#D4AF37]/20'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isConnecting || !pin.trim() || !name.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#1B4D3E] via-[#0F3B46] to-[#D4AF37] text-[#D4AF37] border border-[#D4AF37]/50 disabled:opacity-40 btn-emil-spring shadow-lg shadow-[#D4AF37]/20"
            >
              {isConnecting ? 'Đang Kết Nối...' : 'VÀO PHÒNG CHỜ NGAY'}
            </button>
          </form>

          {onExit && (
            <button onClick={onExit} className="text-xs text-slate-500 hover:text-slate-300">
              Quay lại giao diện chính
            </button>
          )}
        </div>
      )}

      {/* PERSISTENT SCORE BOARD HEADER ON STUDENT PHONE */}
      {isJoined && (
        <div className="max-w-md w-full mb-4 p-3 rounded-2xl bg-[#06181e] border border-[#D4AF37]/35 flex items-center justify-between text-xs font-bold font-sans-vn shadow-lg">
          <div className="flex items-center gap-1.5 text-[#D4AF37]">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Cá nhân: <strong className="text-white font-extrabold">{personalScore}</strong> đ</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#52B788]">
            <Users className="w-4 h-4 text-[#52B788]" />
            <span className="truncate max-w-[170px]">{teams.find((t) => t.id === selectedTeam)?.name || 'Đội nhà'}: <strong className="text-white font-extrabold">{teamScores[selectedTeam] || 0}</strong> đ</span>
          </div>
        </div>
      )}

      {/* 2. JOINED LOBBY WAIT SCREEN */}
      {isJoined && gameState === 'lobby' && (
        <div className="glass-panel rounded-3xl p-8 max-w-sm w-full border border-slate-800 space-y-6 text-center shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-heading text-slate-100">Đã Kết Nối Phòng Thi!</h2>
            <p className="text-sm font-semibold text-amber-400">{name}</p>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 inline-block">
              {teams.find((t) => t.id === selectedTeam)?.name}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2">
            <Clock className="w-5 h-5 text-amber-400 mx-auto animate-spin" />
            <p>Đang chờ Cô Giáo bấm "Bắt Đầu Trận Đấu" trên máy chiếu...</p>
          </div>
        </div>
      )}

      {/* 3. KAHOOT-STYLE MOBILE ANSWER SCREEN (4 BIG COLOR BUTTONS) */}
      {isJoined && gameState === 'answering' && (
        <div className="max-w-md w-full space-y-4 animate-fade-in text-center">
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <span className="text-xs font-bold uppercase text-amber-400">Chọn Đáp Án Trên Điện Thoại</span>
          </div>

          {/* Big Color Buttons for MCQ */}
          {(!currentQuestion || currentQuestion?.type === 'mcq') && (
            <div className="grid grid-cols-2 gap-4 h-72 sm:h-80">
              <button
                onClick={() => handleSendAnswer('A')}
                className="rounded-3xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-3xl shadow-xl flex items-center justify-center border-2 border-rose-400 transition-all"
              >
                🔴 A
              </button>

              <button
                onClick={() => handleSendAnswer('B')}
                className="rounded-3xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-extrabold text-3xl shadow-xl flex items-center justify-center border-2 border-sky-400 transition-all"
              >
                🔵 B
              </button>

              <button
                onClick={() => handleSendAnswer('C')}
                className="rounded-3xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-3xl shadow-xl flex items-center justify-center border-2 border-amber-300 transition-all"
              >
                🟡 C
              </button>

              <button
                onClick={() => handleSendAnswer('D')}
                className="rounded-3xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-3xl shadow-xl flex items-center justify-center border-2 border-emerald-400 transition-all"
              >
                🟢 D
              </button>
            </div>
          )}

          {/* True / False Matrix (4 Sub-statements a, b, c, d) */}
          {currentQuestion?.type === 'true_false' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-300">
                Đánh giá Đúng hoặc Sai cho cả 4 ý bên dưới:
              </div>

              <div className="space-y-3">
                {(currentQuestion?.statements || [
                  { key: 'a', statement: 'Ý a' },
                  { key: 'b', statement: 'Ý b' },
                  { key: 'c', statement: 'Ý c' },
                  { key: 'd', statement: 'Ý d' },
                ]).map((st: any) => (
                  <div key={st.key} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-200 text-left font-medium">
                      <strong className="text-rose-400 mr-1">{st.key})</strong>
                      {st.statement}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setTfSubAnswers((prev) => ({ ...prev, [st.key]: 'Đ' }));
                        }}
                        className={`px-3 py-1.5 rounded-lg font-extrabold text-xs border transition-all ${
                          tfSubAnswers[st.key] === 'Đ'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        ĐÚNG
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setTfSubAnswers((prev) => ({ ...prev, [st.key]: 'S' }));
                        }}
                        className={`px-3 py-1.5 rounded-lg font-extrabold text-xs border transition-all ${
                          tfSubAnswers[st.key] === 'S'
                            ? 'bg-rose-500 text-white border-rose-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        SAI
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const jsonAns = JSON.stringify(tfSubAnswers);
                  handleSendAnswer(jsonAns);
                }}
                disabled={Object.keys(tfSubAnswers).length < 4}
                className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20"
              >
                XÁC NHẬN ĐÁP ÁN 4 Ý
              </button>
            </div>
          )}

          {/* Short Answer Input */}
          {currentQuestion?.type === 'short_answer' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-300">
                Nhập số hoặc câu trả lời ngắn của bạn:
              </div>

              <input
                type="text"
                value={saInputVal}
                onChange={(e) => setSaInputVal(e.target.value)}
                placeholder="Nhập kết quả..."
                className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center font-bold text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />

              <button
                type="button"
                onClick={() => handleSendAnswer(saInputVal.trim())}
                disabled={!saInputVal.trim()}
                className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:from-amber-400 disabled:opacity-40 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>GỬI KẾT QUẢ TÍNH TOÁN</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* 4. SUBMITTED WAIT SCREEN */}
      {isJoined && gameState === 'submitted' && (
        <div className="glass-panel rounded-3xl p-8 max-w-sm w-full border border-slate-800 space-y-6 text-center shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-heading text-slate-100">Đã Gửi Đáp Án ({submittedAnswer})!</h2>
            <p className="text-xs text-slate-400">Hãy theo dõi kết quả công bố trên màn hình máy chiếu của Cô giáo</p>
          </div>
        </div>
      )}

      {/* 5. REVEAL RESULT SCREEN */}
      {isJoined && gameState === 'result' && resultInfo && (
        <div className="glass-panel rounded-3xl p-8 max-w-sm w-full border border-slate-800 space-y-6 text-center shadow-2xl animate-fade-in">
          {resultInfo.isCorrect ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
          )}

          <div className="space-y-2">
            <h2 className={`text-2xl font-extrabold font-heading ${resultInfo.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
              {resultInfo.isCorrect ? '🎉 CHÍNH XÁC!' : '❌ CHƯA CHÍNH XÁC'}
            </h2>
            <p className="text-sm font-bold text-slate-200">
              Đáp án đúng: <span className="text-amber-400">{resultInfo.correctAnswer}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed text-left">
            <p className="font-bold text-emerald-400 mb-1">💡 Lời giải:</p>
            <p>{resultInfo.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};
