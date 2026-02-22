import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import io from 'socket.io-client';

// Team color definitions
const TEAM_COLORS = {
  0: { name: 'White', hex: '#ffffff', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  1: { name: 'Blue', hex: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
  2: { name: 'Purple', hex: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
  3: { name: 'Green', hex: '#22c55e', bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500' },
  4: { name: 'Yellow', hex: '#eab308', bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500' },
  5: { name: 'Red', hex: '#ef4444', bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' },
  6: { name: 'Pink', hex: '#ec4899', bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500' },
  7: { name: 'Orange', hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500' }
};

export default function Lobby() {
  const router = useRouter();
  const { code } = router.query;
  const { data: session, status } = useSession();
  
  const [socket, setSocket] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [timeoutTarget, setTimeoutTarget] = useState(null);
  const [timeoutDuration, setTimeoutDuration] = useState(30);
  const [timeoutReason, setTimeoutReason] = useState('');

  useEffect(() => {
    if (!code || status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinLobby', {
        code: code.toUpperCase(),
        userData: {
          odiscordId: session.user.discordId,
          username: session.user.name,
          avatar: session.user.image
        }
      });
    });

    newSocket.on('lobbyJoined', (lobbyData) => {
      setLobby(lobbyData);
      setLoading(false);
      setError(null);
    });

    newSocket.on('lobbyUpdate', (lobbyData) => {
      setLobby(lobbyData);
    });

    newSocket.on('error', (data) => {
      setError(data.message);
      setLoading(false);
    });

    newSocket.on('playerKicked', ({ odiscordId, reason }) => {
      if (odiscordId === session.user.discordId) {
        alert(reason || 'You have been removed from the lobby');
        router.push('/');
      }
    });

    newSocket.on('lobbyClosed', ({ reason }) => {
      alert(reason || 'Lobby has been closed');
      router.push('/');
    });

    newSocket.on('timeoutSuccess', ({ odiscordId, mins }) => {
      alert(`Player timed out for ${mins} minutes`);
      setShowTimeoutModal(false);
    });

    return () => {
      newSocket.close();
    };
  }, [code, session, status, router]);

  const copyCode = () => {
    navigator.clipboard.writeText(code?.toUpperCase() || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = lobby?.host?.odiscordId === session?.user?.discordId;

  const kickPlayer = (odiscordId) => {
    if (socket && isHost) {
      socket.emit('kickPlayer', { lobbyId: lobby.id, odiscordId });
    }
  };

  const whitelistPlayer = (odiscordId) => {
    if (socket && isHost) {
      socket.emit('whitelistPlayer', { lobbyId: lobby.id, odiscordId });
    }
  };

  const unwhitelistPlayer = (odiscordId) => {
    if (socket && isHost) {
      socket.emit('unwhitelistPlayer', { lobbyId: lobby.id, odiscordId });
    }
  };

  const openTimeoutModal = (player) => {
    setTimeoutTarget(player);
    setTimeoutDuration(30);
    setTimeoutReason('');
    setShowTimeoutModal(true);
  };

  const submitTimeout = () => {
    if (socket && timeoutTarget) {
      socket.emit('timeoutPlayer', {
        odiscordId: timeoutTarget.odiscordId,
        duration: timeoutDuration,
        reason: timeoutReason
      });
    }
  };

  const setTeamColor = (team, colorId) => {
    if (socket && isHost) {
      socket.emit('setTeamColors', {
        lobbyId: lobby.id,
        [team === 1 ? 'team1Color' : 'team2Color']: colorId
      });
    }
  };

  const startGame = () => {
    if (socket && isHost) {
      socket.emit('startCaptainSelect', { lobbyId: lobby.id });
    }
  };

  const leaveLobby = () => {
    if (socket) {
      socket.emit('leaveLobby', { lobbyId: lobby.id });
      router.push('/');
    }
  };

  const closeLobby = () => {
    if (socket && isHost) {
      socket.emit('closeLobby', { lobbyId: lobby.id });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="font-display text-2xl mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  if (!lobby) return null;

  const team1Color = TEAM_COLORS[lobby.team1Color || 1];
  const team2Color = TEAM_COLORS[lobby.team2Color || 5];

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-display text-3xl">LOBBY</h1>
                  <button
                    onClick={copyCode}
                    className="font-mono text-2xl tracking-widest px-4 py-2 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                    style={{ color: '#9ced23' }}
                  >
                    {code?.toUpperCase()}
                    {copied && <span className="ml-2 text-sm">✓</span>}
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{lobby.players?.length || 0}/{lobby.maxPlayers} players</span>
                  <span className={lobby.isRanked ? 'text-yellow-400' : 'text-gray-500'}>
                    {lobby.isRanked ? '⭐ Ranked' : '🎮 Casual'}
                  </span>
                  <span className="capitalize">{lobby.phase}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                {isHost && lobby.phase === 'waiting' && (
                  <button onClick={startGame} className="btn-primary">
                    Start Game
                  </button>
                )}
                {isHost ? (
                  <button onClick={closeLobby} className="btn-secondary text-red-400">
                    Close Lobby
                  </button>
                ) : (
                  <button onClick={leaveLobby} className="btn-secondary">
                    Leave
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Team Color Selector (Host only, waiting phase) */}
          {isHost && lobby.phase === 'waiting' && (
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-6">
              <h2 className="font-display text-xl mb-4">TEAM COLORS</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Team 1</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(TEAM_COLORS).map(([id, color]) => (
                      <button
                        key={id}
                        onClick={() => setTeamColor(1, parseInt(id))}
                        className={`w-8 h-8 rounded-lg ${color.bg} ${lobby.team1Color == id ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800' : ''}`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Team 2</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(TEAM_COLORS).map(([id, color]) => (
                      <button
                        key={id}
                        onClick={() => setTeamColor(2, parseInt(id))}
                        className={`w-8 h-8 rounded-lg ${color.bg} ${lobby.team2Color == id ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800' : ''}`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Players List */}
          {lobby.phase === 'waiting' && (
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-6">
              <h2 className="font-display text-xl mb-4">PLAYERS</h2>
              <div className="grid gap-3">
                {lobby.players?.map((player, i) => {
                  const isWhitelisted = lobby.whitelist?.includes(player.odiscordId);
                  const isPlayerHost = player.odiscordId === lobby.host?.odiscordId;
                  
                  return (
                    <div key={player.odiscordId} className="flex items-center justify-between bg-dark-700 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dark-600 overflow-hidden">
                          {player.minecraftUuid ? (
                            <img src={`https://mc-heads.net/avatar/${player.minecraftUuid}`} alt="" className="w-full h-full" />
                          ) : player.avatar ? (
                            <img src={player.avatar} alt="" className="w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">{player.username?.[0]}</div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{player.minecraftUsername || player.username}</span>
                            {isPlayerHost && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Host</span>}
                            {isWhitelisted && !isPlayerHost && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Whitelisted</span>}
                          </div>
                          <div className="text-xs text-gray-500">{player.elo || 500} ELO</div>
                        </div>
                      </div>
                      
                      {isHost && !isPlayerHost && (
                        <div className="flex gap-2">
                          {isWhitelisted ? (
                            <button
                              onClick={() => unwhitelistPlayer(player.odiscordId)}
                              className="text-xs px-3 py-1 bg-dark-600 text-gray-400 rounded hover:bg-dark-500"
                            >
                              Remove WL
                            </button>
                          ) : (
                            <button
                              onClick={() => whitelistPlayer(player.odiscordId)}
                              className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                            >
                              Whitelist
                            </button>
                          )}
                          <button
                            onClick={() => kickPlayer(player.odiscordId)}
                            className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                          >
                            Kick
                          </button>
                          <button
                            onClick={() => openTimeoutModal(player)}
                            className="text-xs px-3 py-1 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30"
                          >
                            Timeout
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Teams Display (during/after draft) */}
          {(lobby.phase === 'drafting' || lobby.phase === 'playing' || lobby.phase === 'finished') && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Team 1 */}
              <div className={`bg-dark-800 border rounded-2xl p-6 ${team1Color.border}/30`}>
                <h3 className={`font-display text-xl mb-4 ${team1Color.text}`}>
                  TEAM 1
                  {lobby.phase === 'playing' && <span className="ml-2 text-2xl">{lobby.score?.team1 || 0}</span>}
                </h3>
                <div className="space-y-3">
                  {lobby.teams?.team1?.map(player => (
                    <div key={player.odiscordId} className="flex items-center gap-3 bg-dark-700 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-full bg-dark-600 overflow-hidden">
                        {player.minecraftUuid ? (
                          <img src={`https://mc-heads.net/avatar/${player.minecraftUuid}`} alt="" className="w-full h-full" />
                        ) : player.avatar ? (
                          <img src={player.avatar} alt="" className="w-full h-full" />
                        ) : null}
                      </div>
                      <span>{player.minecraftUsername || player.username}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team 2 */}
              <div className={`bg-dark-800 border rounded-2xl p-6 ${team2Color.border}/30`}>
                <h3 className={`font-display text-xl mb-4 ${team2Color.text}`}>
                  TEAM 2
                  {lobby.phase === 'playing' && <span className="ml-2 text-2xl">{lobby.score?.team2 || 0}</span>}
                </h3>
                <div className="space-y-3">
                  {lobby.teams?.team2?.map(player => (
                    <div key={player.odiscordId} className="flex items-center gap-3 bg-dark-700 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-full bg-dark-600 overflow-hidden">
                        {player.minecraftUuid ? (
                          <img src={`https://mc-heads.net/avatar/${player.minecraftUuid}`} alt="" className="w-full h-full" />
                        ) : player.avatar ? (
                          <img src={player.avatar} alt="" className="w-full h-full" />
                        ) : null}
                      </div>
                      <span>{player.minecraftUsername || player.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeout Modal */}
      {showTimeoutModal && timeoutTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 max-w-md w-full">
            <h2 className="font-display text-xl mb-4">Timeout Player</h2>
            <p className="text-gray-400 mb-4">
              Timeout <span className="text-white">{timeoutTarget.username}</span> from all lobbies
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={timeoutDuration}
                onChange={(e) => setTimeoutDuration(Math.max(1, Math.min(1440, parseInt(e.target.value) || 30)))}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-500 rounded-lg"
                min="1"
                max="1440"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Reason (optional)</label>
              <input
                type="text"
                value={timeoutReason}
                onChange={(e) => setTimeoutReason(e.target.value)}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-500 rounded-lg"
                placeholder="Reason for timeout"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowTimeoutModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={submitTimeout}
                className="flex-1 btn-primary bg-orange-500 hover:bg-orange-600"
              >
                Timeout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
