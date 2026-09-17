import React, { useState, useEffect } from 'react';
import { GradeLevel, LessonTopic, QuestionItem, TeamInfo, MCQQuestion, TrueFalseQuestion, ShortAnswerQuestion } from '../types/quiz';
import { mpNetwork, Player } from '../utils/multiplayer';
import { QRCodeSVG } from 'qrcode.react';
import { Swords, Trophy, Users, Play, Clock, Sparkles, Plus, Minus, RotateCcw, Volume2, HelpCircle, ChevronRight, Eye, QrCode, Smartphone, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ClassroomGameModeProps {
  grade: GradeLevel;
  topics: LessonTopic[];
  onOpenStudentView?: () => void;
  onSelectGrade?: (grade: GradeLevel) => void;
}

const DEFAULT_TEAMS: TeamInfo[] = [
  { id: 't1', name: 'Đội Trâu Vàng 🐃', color: 'text-[#D4AF37]', bgClass: 'bg-[#D4AF37]/15', borderClass: 'border-[#D4AF37]/40', score: 0 },
  { id: 't2', name: 'Đội Chim Lạc 🦅', color: 'text-[#38BDF8]', bgClass: 'bg-[#0F3B46]/50', borderClass: 'border-[#38BDF8]/40', score: 0 },
  { id: 't3', name: 'Đội Sao La 🦌', color: 'text-[#F43F5E]', bgClass: 'bg-[#F43F5E]/15', borderClass: 'border-[#F43F5E]/40', score: 0 },
  { id: 't4', name: 'Đội Voọc Quần Đùi 🐒', color: 'text-[#A855F7]', bgClass: 'bg-[#A855F7]/15', borderClass: 'border-[#A855F7]/40', score: 0 },
];

export const ClassroomGameMode: React.FC<ClassroomGameModeProps> = ({ grade, topics, onOpenStudentView, onSelectGrade }) => {
  // Game state: 'setup' | 'lobby' | 'playing' | 'gameover'
  const [gameState, setGameState] = useState<'setup' | 'lobby' | 'playing' | 'gameover'>('setup');

  // Network Room PIN
  const [roomPin, setRoomPin] = useState<string>('');
  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([]);

  // Configs
  const [numTeams, setNumTeams] = useState<number>(2);
  const [teams, setTeams] = useState<TeamInfo[]>(DEFAULT_TEAMS.slice(0, 2));
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [targetScore, setTargetScore] = useState<number>(50);

  // Active Questions List for match
  const [gameQuestions, setGameQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Question state
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [playerAnswersMap, setPlayerAnswersMap] = useState<Record<string, string>>({}); // peerId -> answer

  // Timer
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Update team count
  useEffect(() => {
    setTeams(DEFAULT_TEAMS.slice(0, numTeams).map((t) => ({ ...t, score: 0 })));
  }, [numTeams]);

  // Create Room Network Handler
  const createMultiplayerRoom = async () => {
    sounds.playClick();
    const pin = mpNetwork.generatePin();
    setRoomPin(pin);
    setConnectedPlayers([]);

    try {
      await mpNetwork.createRoom(pin);
      setGameState('lobby');
    } catch (err) {
      console.error('Error creating room:', err);
      // Fallback local lobby if network offline
      setGameState('lobby');
    }
  };

  useEffect(() => {
    mpNetwork.onPlayerJoined = (player) => {
      sounds.playCorrect();
      // Ensure player's team is strictly one of the active teams configured by the teacher
      const validTeamIds = teams.map((t) => t.id);
      const activeTeamId = validTeamIds.includes(player.teamId) ? player.teamId : validTeamIds[0];
      const sanitizedPlayer = { ...player, teamId: activeTeamId };

      setConnectedPlayers((prev) => [...prev.filter((p) => p.peerId !== sanitizedPlayer.peerId), sanitizedPlayer]);

      // Broadcast active room config & teams to student phones
      mpNetwork.broadcast({
        type: 'GAME_STATE',
        state: gameState === 'playing' ? 'playing' : 'lobby',
        activeTeams: teams.map((t) => ({ id: t.id, name: t.name, color: t.color, score: t.score })),
        question: gameState === 'playing' ? gameQuestions[currentIndex] : undefined,
      });
    };

    mpNetwork.onPlayerAnswer = (peerId, answer, timeSpent) => {
      sounds.playClick();
      setPlayerAnswersMap((prev) => ({ ...prev, [peerId]: answer }));
    };
  }, [teams, gameState, gameQuestions, currentIndex]);

  // Broadcast active teams whenever team selection changes in setup
  useEffect(() => {
    if (gameState === 'lobby') {
      mpNetwork.broadcast({
        type: 'GAME_STATE',
        state: 'lobby',
        activeTeams: teams.map((t) => ({ id: t.id, name: t.name, color: t.color, score: t.score })),
      });
    }
  }, [teams, gameState]);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || gameState !== 'playing') return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          sounds.playIncorrect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, gameState]);

  // Start game broadcast
  const startMatchBroadcast = () => {
    sounds.playClick();
    let qList: QuestionItem[] = [];
    topics.forEach((t) => {
      if (selectedTopicId === 'all' || t.id === selectedTopicId) {
        qList.push(...t.mcq_questions);
        qList.push(...t.tf_questions);
        qList.push(...t.sa_questions);
      }
    });

    const shuffled = [...qList].sort(() => Math.random() - 0.5);
    if (shuffled.length === 0) {
      alert('Không tìm thấy câu hỏi thích hợp!');
      return;
    }

    setGameQuestions(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
    setPlayerAnswersMap({});
    setTimerSeconds(30);
    setIsTimerRunning(true);
    setGameState('playing');

    // Broadcast first question to all connected phones
    mpNetwork.broadcast({
      type: 'GAME_STATE',
      state: 'playing',
      question: shuffled[0],
      activeTeams: teams.map((t) => ({ id: t.id, name: t.name, color: t.color, score: t.score })),
    });
  };

  // Adjust score
  const adjustScore = (teamId: string, delta: number) => {
    sounds.playClick();
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const newScore = Math.max(0, t.score + delta);
          if (newScore >= targetScore) {
            sounds.triggerConfetti();
            sounds.playCorrect();
            setGameState('gameover');
          }
          return { ...t, score: newScore };
        }
        return t;
      })
    );
  };

  // Reveal Answer & Auto Calculate Team Scores
  const handleRevealAnswer = () => {
    sounds.playClick();
    setShowAnswer(!showAnswer);

    if (!showAnswer && currentQ) {
      // Calculate team correctness from connected student responses
      const correctAnswersCountByTeam: Record<string, number> = {};

      connectedPlayers.forEach((player) => {
        const studentAns = playerAnswersMap[player.peerId];
        let isCorrect = false;
        let points = 0;

        if (currentQ.type === 'mcq') {
          const sLetter = (studentAns || '').trim().toUpperCase().charAt(0);
          const cLetter = (currentQ.answer || 'A').trim().toUpperCase().charAt(0);
          isCorrect = sLetter === cLetter;
          points = isCorrect ? 10 : 0;
        } else if (currentQ.type === 'true_false') {
          try {
            const parsedObj = typeof studentAns === 'string' ? JSON.parse(studentAns) : studentAns;
            let subCount = 0;
            currentQ.statements.forEach((st) => {
              if (parsedObj && parsedObj[st.key] && parsedObj[st.key].toUpperCase() === st.answer.toUpperCase()) {
                subCount += 1;
              }
            });
            if (subCount === 4) { isCorrect = true; points = 10; }
            else if (subCount === 3) { points = 7; }
            else if (subCount === 2) { points = 5; }
            else if (subCount === 1) { points = 2; }
          } catch {
            points = 0;
          }
        } else if (currentQ.type === 'short_answer') {
          const sVal = (studentAns || '').trim().replace(',', '.').toLowerCase();
          const cVal = (currentQ.answer || '').trim().replace(',', '.').toLowerCase();
          const nUser = parseFloat(sVal);
          const nAns = parseFloat(cVal);

          isCorrect = sVal === cVal;
          if (!isNaN(nUser) && !isNaN(nAns)) {
            isCorrect = Math.abs(nUser - nAns) < 0.15;
          }
          points = isCorrect ? 10 : 0;
        }

        if (points > 0) {
          correctAnswersCountByTeam[player.teamId] = (correctAnswersCountByTeam[player.teamId] || 0) + points;
        }
      });

      const updatedTeams = teams.map((t) => {
        const bonus = correctAnswersCountByTeam[t.id] || 0;
        return { ...t, score: t.score + bonus };
      });
      setTeams(updatedTeams);

      const teamScoresMap: Record<string, number> = {};
      updatedTeams.forEach((t) => {
        teamScoresMap[t.id] = t.score;
      });

      const correctAnsStr = currentQ.type === 'mcq'
        ? currentQ.answer
        : currentQ.type === 'short_answer'
        ? currentQ.answer
        : currentQ.statements.map((st) => `${st.key}: ${st.answer}`).join(', ');

      connectedPlayers.forEach((player) => {
        const studentAns = playerAnswersMap[player.peerId];
        let isCorrect = false;
        let points = 0;

        if (currentQ.type === 'mcq') {
          const sLetter = (studentAns || '').trim().toUpperCase().charAt(0);
          const cLetter = (currentQ.answer || 'A').trim().toUpperCase().charAt(0);
          isCorrect = sLetter === cLetter;
          points = isCorrect ? 10 : 0;
        } else if (currentQ.type === 'true_false') {
          try {
            const parsedObj = typeof studentAns === 'string' ? JSON.parse(studentAns) : studentAns;
            let subCount = 0;
            currentQ.statements.forEach((st) => {
              if (parsedObj && parsedObj[st.key] && parsedObj[st.key].toUpperCase() === st.answer.toUpperCase()) {
                subCount += 1;
              }
            });
            if (subCount === 4) { isCorrect = true; points = 10; }
            else if (subCount === 3) { points = 7; }
            else if (subCount === 2) { points = 5; }
            else if (subCount === 1) { points = 2; }
          } catch {
            points = 0;
          }
        } else if (currentQ.type === 'short_answer') {
          const sVal = (studentAns || '').trim().replace(',', '.').toLowerCase();
          const cVal = (currentQ.answer || '').trim().replace(',', '.').toLowerCase();
          const nUser = parseFloat(sVal);
          const nAns = parseFloat(cVal);

          isCorrect = sVal === cVal;
          if (!isNaN(nUser) && !isNaN(nAns)) {
            isCorrect = Math.abs(nUser - nAns) < 0.15;
          }
          points = isCorrect ? 10 : 0;
        }

        mpNetwork.broadcast({
          type: 'REVEAL_RESULT',
          isCorrect,
          pointsEarned: points,
          correctAnswer: correctAnsStr,
          explanation: currentQ.explanation,
          teamScores: teamScoresMap,
        });
      });
    }
  };

  const nextQuestionBroadcast = () => {
    sounds.playClick();
    if (currentIndex < gameQuestions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setShowAnswer(false);
      setPlayerAnswersMap({});
      setTimerSeconds(30);
      setIsTimerRunning(true);

      mpNetwork.broadcast({
        type: 'GAME_STATE',
        state: 'playing',
        question: gameQuestions[nextIdx],
        activeTeams: teams.map((t) => ({ id: t.id, name: t.name, color: t.color, score: t.score })),
      });
    } else {
      setGameState('gameover');
    }
  };

  const [hostBaseUrl, setHostBaseUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('study_app_custom_tunnel');
      if (saved && saved.trim()) return saved.trim();
      const origin = window.location.origin;
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return origin;
      }
    }
    return 'https://ward-complimentary-wood-graphics.trycloudflare.com';
  });

  const updateHostBaseUrl = (newUrl: string) => {
    setHostBaseUrl(newUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('study_app_custom_tunnel', newUrl);
    }
  };

  const currentQ = gameQuestions[currentIndex];
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const joinUrl = `${hostBaseUrl}/?mode=student&pin=${roomPin}&teams=${numTeams}`;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. SETUP STAGE */}
      {gameState === 'setup' && (
        <div className="vietnam-glass rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/35 max-w-3xl mx-auto space-y-6 shadow-2xl">
          <div className="flex items-center gap-3.5 border-b border-[#D4AF37]/20 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#06181e] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-md shadow-[#D4AF37]/15">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-serif-vn font-bold text-white gradient-text-gold">
                Đấu Trường Đội Nhóm Lớp Học
              </h2>
              <p className="text-xs text-[#E8D8C8]/80 font-sans-vn mt-0.5">
                Cô giáo chiếu máy chiếu, học sinh dùng điện thoại quét mã QR tham gia thi đấu trực tiếp.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Number of Teams */}
            <div>
              <label className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider block mb-2 font-sans-vn">
                1. Chọn Số Lượng Đội Thi Đấu
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      sounds.playClick();
                      setNumTeams(n);
                    }}
                    className={`py-3.5 rounded-xl font-bold text-xs btn-emil-press border transition-all ${
                      numTeams === n
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#051419] border-[#FDE68A] font-extrabold shadow-lg shadow-[#D4AF37]/20 scale-105'
                        : 'bg-[#051419] text-[#E8D8C8] border-[#D4AF37]/30 hover:text-white hover:border-[#D4AF37]/60'
                    }`}
                  >
                    {n} Đội Thi
                  </button>
                ))}
              </div>
            </div>

            {/* Team Names Customizer */}
            <div>
              <label className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider block mb-2 font-sans-vn">
                2. Tên Các Đội Thi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teams.map((team) => (
                  <div key={team.id} className={`p-3.5 rounded-xl border ${team.bgClass} ${team.borderClass} flex items-center gap-2.5`}>
                    <Users className={`w-4 h-4 ${team.color}`} />
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setTeams((prev) => prev.map((t) => (t.id === team.id ? { ...t, name: newName } : t)));
                      }}
                      className="bg-transparent text-xs font-bold text-white focus:outline-none w-full font-sans-vn"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Level, Topic & Target Score */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider block mb-1 font-sans-vn">
                  3. Khối Lớp Thi Đấu
                </label>
                <div className="flex items-center gap-1">
                  {([6, 7, 8, 9] as GradeLevel[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        if (onSelectGrade) onSelectGrade(g);
                        setSelectedTopicId('all');
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                        grade === g
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#051419] border-[#FDE68A] font-extrabold shadow'
                          : 'bg-[#051419] text-[#E8D8C8]/70 border-[#D4AF37]/30 hover:text-white'
                      }`}
                    >
                      Lớp {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider block mb-1 font-sans-vn">
                  4. Bài Học Kiểm Tra
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#051419] border border-[#D4AF37]/40 text-xs text-white focus:border-[#FDE68A] focus:outline-none font-bold font-sans-vn"
                >
                  <option value="all">Tất cả bài học Lớp {grade}</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider block mb-1 font-sans-vn">
                  5. Điểm Mục Tiêu Thắng
                </label>
                <select
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#051419] border border-[#D4AF37]/40 text-xs text-white focus:border-[#FDE68A] focus:outline-none font-bold font-sans-vn"
                >
                  <option value={30}>30 Điểm</option>
                  <option value={50}>50 Điểm (Tiêu chuẩn)</option>
                  <option value={100}>100 Điểm</option>
                </select>
              </div>
            </div>

            {/* 6. PUBLIC TUNNEL CONFIGURATION */}
            <div className="p-4 rounded-2xl bg-[#051419]/90 border border-[#D4AF37]/30 space-y-2.5">
              <label className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider block font-sans-vn flex items-center justify-between">
                <span>6. Đường Truyền Public Mã QR (Tunnel / IP)</span>
                <span className="text-[10px] text-[#52B788] normal-case font-semibold">🔗 Giúp Điện Thoại Kết Nối Mượt</span>
              </label>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={hostBaseUrl}
                  onChange={(e) => updateHostBaseUrl(e.target.value)}
                  placeholder="https://...trycloudflare.com hoặc http://192.168.x.x:5173"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#06181e] border border-[#D4AF37]/40 text-xs font-mono text-[#D4AF37] focus:border-[#FDE68A] focus:outline-none font-bold"
                />
                <button
                  type="button"
                  onClick={() => updateHostBaseUrl('https://ward-complimentary-wood-graphics.trycloudflare.com')}
                  className="px-3 py-2 rounded-xl bg-[#1B4D3E]/60 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold hover:bg-[#1B4D3E] transition-all"
                  title="Dùng Cloudflare Tunnel trực tiếp"
                >
                  Reset Cloudflare
                </button>
              </div>

              <p className="text-[11px] text-[#E8D8C8]/75 leading-normal font-sans-vn">
                📌 Khi chạy trên máy tính, mã QR sẽ tạo link tham gia bắt đầu bằng URL trên. Bạn có thể sử dụng Cloudflare Tunnel công khai hoặc nhập IP Wi-Fi máy tính.
              </p>
            </div>
          </div>

          <button
            onClick={createMultiplayerRoom}
            className="w-full py-4 rounded-2xl font-extrabold text-sm sm:text-base bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#051419] border border-[#FDE68A] shadow-xl shadow-[#D4AF37]/25 btn-emil-spring flex items-center justify-center gap-2.5"
          >
            <QrCode className="w-5 h-5 text-[#051419]" />
            <span className="tracking-wide uppercase font-extrabold">TẠO PHÒNG & MÃ QR TRÌNH CHIẾU LỚP HỌC</span>
          </button>
        </div>
      )}

      {/* 2. REAL-TIME LOBBY STAGE WITH QR CODE */}
      {gameState === 'lobby' && (
        <div className="vietnam-glass rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/35 max-w-4xl mx-auto space-y-8 shadow-2xl text-center">
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 bg-[#051419]/90 p-6 rounded-3xl border border-[#D4AF37]/25">
            
            {/* Big QR Code for Phones */}
            <div className="p-4 bg-white rounded-2xl shadow-xl shrink-0 flex flex-col items-center gap-2 border border-[#D4AF37]/40">
              <QRCodeSVG value={joinUrl} size={160} />
              <span className="text-[10px] font-bold font-mono text-[#0F3B46]">Quét QR hoặc nhập URL</span>
            </div>

            {/* Room PIN Code & LAN IP */}
            <div className="space-y-3 text-center sm:text-left flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                  Màn Hình Cô Giáo Máy Chiếu
                </span>
                <span className="text-xs text-[#E8D8C8]/70">
                  Địa chỉ Web: <input type="text" value={hostBaseUrl} onChange={(e) => setHostBaseUrl(e.target.value)} className="bg-[#06181e] px-2 py-0.5 rounded border border-[#D4AF37]/30 font-mono text-[#D4AF37] font-bold w-64 focus:outline-none text-xs" />
                </span>
              </div>

              <h3 className="text-xs font-serif-vn font-bold text-[#E8D8C8]/80 uppercase tracking-wider">
                Mã Phòng Kết Nối Trực Tiếp:
              </h3>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-widest text-[#D4AF37] bg-[#06181e] px-6 py-3 rounded-2xl border border-[#D4AF37]/40 inline-block shadow-inner">
                {roomPin}
              </div>

              <div className="p-3 rounded-xl bg-[#06181e] border border-[#D4AF37]/20 text-xs font-mono text-[#E8D8C8] break-all">
                🔗 Link mở trên điện thoại: <strong className="text-[#D4AF37]">{joinUrl}</strong>
              </div>
            </div>

          </div>

          {/* Connected Roster by Teams */}
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <h4 className="text-base font-bold font-serif-vn text-[#E8D8C8] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D4AF37]" />
                <span>Danh Sách Học Sinh Đã Vào Phòng ({connectedPlayers.length})</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {teams.map((t) => {
                const teamPlayers = connectedPlayers.filter((p) => p.teamId === t.id);
                return (
                  <div key={t.id} className={`p-4 rounded-2xl border ${t.bgClass} ${t.borderClass} space-y-3`}>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className={`text-xs font-bold ${t.color}`}>{t.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#051419] font-bold text-[#E8D8C8]">
                        {teamPlayers.length} HS
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {teamPlayers.length > 0 ? (
                        teamPlayers.map((p) => (
                          <div key={p.peerId} className="text-xs font-medium text-[#E8D8C8] flex items-center gap-1.5 p-1.5 rounded bg-[#051419]/80">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span className="truncate">{p.name}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-[#E8D8C8]/40 italic">Chưa có học sinh...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={startMatchBroadcast}
            className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#1B4D3E] via-[#0F3B46] to-[#D4AF37] text-[#D4AF37] border border-[#D4AF37]/50 shadow-xl shadow-[#D4AF37]/20 btn-emil-spring flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-[#D4AF37]" />
            <span>BẮT ĐẦU TRẬN ĐẤU THI ĐẤU TRÊN MÁY CHIẾU</span>
          </button>
        </div>
      )}

      {/* 3. PLAYING STAGE ON PROJECTOR */}
      {gameState === 'playing' && currentQ && (
        <div className="space-y-6">
          
          {/* ANIMAL RACE TRACK VISUALIZATION (ĐƯỜNG ĐUA LINH THÚ VIỆT NAM) */}
          <div className="vietnam-glass rounded-3xl p-5 border border-[#D4AF37]/35 space-y-4 shadow-2xl relative overflow-hidden">
            
            {/* Race Track Header */}
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏁</span>
                <h3 className="text-sm sm:text-base font-bold font-serif-vn gradient-text-gold uppercase tracking-wider">
                  ĐƯỜNG ĐUA LINH THÚ VIỆT NAM
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                  Mục tiêu: {targetScore} điểm
                </span>
              </div>
              <span className="text-xs text-[#E8D8C8]/70 font-sans-vn hidden sm:inline">
                Khoảng cách đến Vạch Đích tỉ lệ với tổng số điểm
              </span>
            </div>

            {/* Race Track Lanes */}
            <div className="space-y-3.5 pt-1">
              {(() => {
                // Calculate rankings sorted by score
                const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
                const ranksMap: Record<string, number> = {};
                sortedTeams.forEach((t, idx) => { ranksMap[t.id] = idx + 1; });

                const medalIcons = ['🥇', '🥈', '🥉', '🏅'];
                const animalIcons: Record<string, string> = {
                  't1': '🐃',
                  't2': '🦅',
                  't3': '🦌',
                  't4': '🐒'
                };

                return teams.map((team) => {
                  const rank = ranksMap[team.id];
                  const progressPct = Math.min(100, Math.max(4, (team.score / Math.max(targetScore, 10)) * 100));
                  const isLeader = rank === 1 && team.score > 0;
                  const mascotIcon = animalIcons[team.id] || '🐾';

                  return (
                    <div key={team.id} className="relative space-y-1">
                      
                      {/* Lane Info Header */}
                      <div className="flex items-center justify-between text-xs px-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{medalIcons[rank - 1] || '🏅'}</span>
                          <span className={`font-bold ${team.color} font-sans-vn text-xs sm:text-sm`}>
                            {team.name}
                          </span>
                          {isLeader && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/50 animate-pulse">
                              🔥 Dẫn Đầu
                            </span>
                          )}
                        </div>

                        {/* Adjust Score Buttons & Live Score */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-[#06181e] p-1 rounded-xl border border-[#D4AF37]/30">
                            <button
                              onClick={() => adjustScore(team.id, -5)}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center transition-all"
                              title="Trừ 5 điểm"
                            >
                              -
                            </button>
                            <span className="font-mono font-extrabold text-white text-sm px-1.5">{team.score}đ</span>
                            <button
                              onClick={() => adjustScore(team.id, 10)}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center transition-all"
                              title="Cộng 10 điểm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Race Track Bar Container */}
                      <div className="h-10 w-full bg-[#051419] rounded-2xl border border-[#D4AF37]/30 relative overflow-hidden flex items-center p-1 shadow-inner">
                        
                        {/* Track Dashed Center Lines */}
                        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none opacity-20">
                          <div className="border-r border-dashed border-slate-400 h-full w-1/4"></div>
                          <div className="border-r border-dashed border-slate-400 h-full w-1/4"></div>
                          <div className="border-r border-dashed border-slate-400 h-full w-1/4"></div>
                        </div>

                        {/* Progress Filled Trail */}
                        <div 
                          className={`h-full rounded-xl transition-all duration-700 ease-out opacity-40 ${
                            team.id === 't1' ? 'bg-[#D4AF37]' :
                            team.id === 't2' ? 'bg-[#38BDF8]' :
                            team.id === 't3' ? 'bg-[#F43F5E]' : 'bg-[#A855F7]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />

                        {/* Animal Mascot Runner Marker */}
                        <div
                          className="absolute transition-all duration-700 ease-out flex items-center gap-1 -translate-x-1/2 z-10"
                          style={{ left: `${Math.max(6, Math.min(94, progressPct))}%` }}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg border-2 ${
                            team.id === 't1' ? 'bg-[#D4AF37]/30 border-[#D4AF37] shadow-[#D4AF37]/40' :
                            team.id === 't2' ? 'bg-[#38BDF8]/30 border-[#38BDF8] shadow-[#38BDF8]/40' :
                            team.id === 't3' ? 'bg-[#F43F5E]/30 border-[#F43F5E] shadow-[#F43F5E]/40' :
                            'bg-[#A855F7]/30 border-[#A855F7] shadow-[#A855F7]/40'
                          } ${isLeader ? 'scale-125 animate-bounce' : 'scale-100'}`}>
                            {mascotIcon}
                          </div>
                        </div>

                        {/* Finish Line Flag Marker */}
                        <div className="absolute right-2 top-0 bottom-0 flex items-center text-sm font-extrabold text-rose-400 z-0 opacity-80">
                          🏁 VẠCH ĐÍCH
                        </div>
                      </div>

                    </div>
                  );
                });
              })()}
            </div>

          </div>

          {/* Main Question Display Container */}
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 space-y-6 shadow-2xl relative">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
                  Câu {currentIndex + 1} / {gameQuestions.length}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-semibold">
                  {currentQ.difficulty}
                </span>
              </div>

              {/* Student Response Progress */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                  {Object.keys(playerAnswersMap).length} / {connectedPlayers.length || 1} Đã Gửi Đáp Án
                </span>

                <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                  <Clock className={`w-4 h-4 ${timerSeconds <= 5 ? 'text-rose-500 animate-ping' : 'text-amber-400'}`} />
                  <span className={`text-base font-bold font-heading ${timerSeconds <= 5 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {timerSeconds}s
                  </span>
                </div>
              </div>
            </div>

            {/* Context Box & Image on Projector */}
            {currentQ.context && (
              <div className="p-4 rounded-2xl bg-[#06181e] border border-[#D4AF37]/40 space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-sans-vn">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>Tư Liệu & Ngữ Cảnh Bài Học</span>
                </div>
                <p className="text-sm text-[#E8D8C8] leading-relaxed font-sans-vn italic">
                  "{currentQ.context}"
                </p>
              </div>
            )}

            {currentQ.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/35 max-h-72 shadow-xl">
                <img 
                  src={currentQ.imageUrl} 
                  alt="Hình ảnh minh họa bài học" 
                  className="w-full h-full object-cover max-h-72" 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/vietnam_map.jpg';
                  }}
                />
              </div>
            )}

            {/* MCQ Big Screen Options */}
            {currentQ.type === 'mcq' && (
              <div className="space-y-6">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug font-heading">
                  {(currentQ as MCQQuestion).question}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(currentQ as MCQQuestion).options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isCorrect = letter === (currentQ as MCQQuestion).answer;

                    return (
                      <div
                        key={letter}
                        className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
                          showAnswer && isCorrect
                            ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 ring-2 ring-emerald-500/40 font-bold'
                            : 'bg-slate-900/90 text-slate-200 border-slate-800'
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                          showAnswer && isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {letter}
                        </span>
                        <span className="text-base sm:text-lg pt-1 font-medium">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentQ.type === 'true_false' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-base leading-relaxed">
                  <span className="text-xs uppercase font-bold text-rose-400 block mb-1">Ngữ liệu & Thông tin:</span>
                  {(currentQ as TrueFalseQuestion).context}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(currentQ as TrueFalseQuestion).statements.map((st) => (
                    <div key={st.key} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-sm">
                      <span><strong className="text-rose-400 mr-2">{st.key})</strong>{st.statement}</span>
                      {showAnswer && (
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${st.answer === 'Đ' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'}`}>
                          {st.answer === 'Đ' ? 'ĐÚNG' : 'SAI'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentQ.type === 'short_answer' && (
              <div className="space-y-6">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug font-heading">
                  {(currentQ as ShortAnswerQuestion).question}
                </h3>
                {(currentQ as ShortAnswerQuestion).instruction && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold">
                    💡 Hướng dẫn làm bài: {(currentQ as ShortAnswerQuestion).instruction}
                  </div>
                )}
                {showAnswer && (
                  <div className="p-5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xl font-bold font-heading">
                    Đáp án đúng: {(currentQ as ShortAnswerQuestion).answer}
                  </div>
                )}
              </div>
            )}


            {/* Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={handleRevealAnswer}
                className="px-5 py-3 rounded-xl font-bold text-xs bg-slate-900 text-slate-200 border border-slate-800 hover:bg-slate-800 flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>{showAnswer ? 'Ẩn Đáp Án' : 'Công Bố Đáp Án & Cộng Điểm Tự Động'}</span>
              </button>

              <button
                onClick={nextQuestionBroadcast}
                className="px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 hover:from-rose-400 hover:to-amber-400 shadow-md shadow-rose-500/20 flex items-center gap-2"
              >
                <span>Câu Tiếp Theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {showAnswer && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1 animate-fade-in">
                <span className="font-bold text-emerald-400 block">💡 Lời giải:</span>
                <p>{currentQ.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. GAMEOVER PODIUM */}
      {gameState === 'gameover' && (
        <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center space-y-8 border border-slate-800 max-w-2xl mx-auto shadow-2xl">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-emerald-500 p-0.5 mx-auto shadow-2xl shadow-amber-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-amber-400">
              <Trophy className="w-12 h-12" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-100">
              Chúc Mừng {sortedTeams[0]?.name}! 🎉
            </h2>
            <p className="text-sm text-slate-400">Đạt tổng điểm cao nhất với {sortedTeams[0]?.score} điểm!</p>
          </div>

          <button
            onClick={() => setGameState('setup')}
            className="px-8 py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow-xl shadow-rose-500/25 inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tổ Chức Trận Đấu Mới</span>
          </button>
        </div>
      )}
    </div>
  );
};
