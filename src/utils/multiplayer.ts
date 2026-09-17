import Peer, { DataConnection } from 'peerjs';

export interface Player {
  peerId: string;
  name: string;
  teamId: string;
  score: number;
  lastAnswer?: string;
  isCorrect?: boolean;
}

export type NetworkMessage =
  | { type: 'JOIN'; name: string; teamId: string }
  | { type: 'SUBMIT_ANSWER'; answer: string; timeSpent: number }
  | { type: 'GAME_STATE'; state: 'lobby' | 'playing' | 'revealed' | 'gameover'; question?: unknown; timer?: number; activeTeams?: Array<{ id: string; name: string; color: string; bgClass?: string; borderClass?: string; score: number }> }
  | { type: 'REVEAL_RESULT'; isCorrect: boolean; pointsEarned: number; correctAnswer: string; explanation: string; teamScores?: Record<string, number> };

class MultiplayerNetwork {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConn: DataConnection | null = null;

  public isHost: boolean = false;
  public roomPin: string = '';

  // Host callbacks
  public onPlayerJoined?: (player: Player) => void;
  public onPlayerAnswer?: (peerId: string, answer: string, timeSpent: number) => void;

  // Student callbacks
  public onGameStateChange?: (msg: NetworkMessage & { type: 'GAME_STATE' }) => void;
  public onRevealResult?: (msg: NetworkMessage & { type: 'REVEAL_RESULT' }) => void;
  public onError?: (err: string) => void;

  // Generate 6-digit PIN
  public generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create Room as Host (Teacher)
  public createRoom(pin: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      this.roomPin = pin;
      const peerId = `study-app-room-${pin}`;

      this.peer = new Peer(peerId, { debug: 1 });

      this.peer.on('open', (id) => {
        console.log('Host room created with Peer ID:', id);
        resolve(pin);
      });

      this.peer.on('connection', (conn) => {
        conn.on('open', () => {
          this.connections.set(conn.peer, conn);
        });

        conn.on('data', (data: unknown) => {
          const msg = data as NetworkMessage;
          if (msg.type === 'JOIN') {
            const player: Player = {
              peerId: conn.peer,
              name: msg.name,
              teamId: msg.teamId,
              score: 0,
            };
            if (this.onPlayerJoined) this.onPlayerJoined(player);
          } else if (msg.type === 'SUBMIT_ANSWER') {
            if (this.onPlayerAnswer) this.onPlayerAnswer(conn.peer, msg.answer, msg.timeSpent);
          }
        });

        conn.on('close', () => {
          this.connections.delete(conn.peer);
        });
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        if (this.onError) this.onError(err.message);
        reject(err);
      });
    });
  }

  // Join Room as Student (Player on phone)
  public joinRoom(pin: string, name: string, teamId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.roomPin = pin;
      const hostPeerId = `study-app-room-${pin}`;

      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', (myId) => {
        console.log('Student Peer ID:', myId);
        const conn = this.peer!.connect(hostPeerId);
        this.hostConn = conn;

        conn.on('open', () => {
          console.log('Connected to Host room:', hostPeerId);
          conn.send({ type: 'JOIN', name, teamId });
          resolve();
        });

        conn.on('data', (data: unknown) => {
          const msg = data as NetworkMessage;
          if (msg.type === 'GAME_STATE' && this.onGameStateChange) {
            this.onGameStateChange(msg);
          } else if (msg.type === 'REVEAL_RESULT' && this.onRevealResult) {
            this.onRevealResult(msg);
          }
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          if (this.onError) this.onError('Không thể kết nối đến mã phòng!');
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        console.error('Peer student error:', err);
        if (this.onError) this.onError('Lỗi kết nối mạng hoặc sai Mã Phòng!');
        reject(err);
      });
    });
  }

  // Host broadcasts message to all students
  public broadcast(msg: NetworkMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  // Student sends answer to host
  public sendAnswer(answer: string, timeSpent: number) {
    if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'SUBMIT_ANSWER', answer, timeSpent });
    }
  }

  // Close network session
  public destroy() {
    this.connections.forEach((c) => c.close());
    this.connections.clear();
    if (this.hostConn) this.hostConn.close();
    if (this.peer) this.peer.destroy();
  }
}

export const mpNetwork = new MultiplayerNetwork();
