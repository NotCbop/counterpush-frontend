import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import io from 'socket.io-client';

export default function LobbyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { code } = router.query;

  const [socket, setSocket] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [testUser, setTestUser] = useState(null);

  // Get current user data
  const getCurrentUser = useCallback(() => {
    if (testMode && testUser) {
      return testUser;
    }
    if (session) {
      return {
        odiscordId: session.user.discordId,
        username: session.user.name,
        avatar: session.user.image
      };
    }
    return null;
  }, [session, testMode, testUser]);

  // Check if current user is host
  const isHost = lobby && getCurrentUser() && lobby.host.odiscordId === getCurrentUser().odiscordId;

  // Check if current user is a captain
  const isCaptain = lobby && getCurrentUser() && lobby.captains.some(c => c.odiscordId === getCurrentUser().odiscordId);

  // Check if it's current user's turn to pick
  const isMyTurn = lobby && lobby.phase === 'drafting' && getCurrentUser() && (() => {
    const currentCaptain = lobby.currentTurn === 'team1' ? lobby.teams.team1[0] : lobby.teams.team2[0];
    return currentCaptain && currentCaptain.odiscordId === getCurrentUser().odiscordId;
  })();

  // Connect to socket
  useEffect(() => {
    if (!code) return;

    // Check for test mode
    const isTestMode = localStorage.getItem('testMode') === 'true';
    const storedTestUser = localStorage.getItem('testUser');
    
    if (isTestMode && storedTestUser) {
      setTestMode(true);
      setTestUser(JSON.parse(storedTestUser));
    }

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      
      const userData = isTestMode && storedTestUser
        ? JSON.parse(storedTestUser)
        : session ? {
            odiscordId: session.user.discordId,
            username: session.user.name,
            avatar: session.user.image
          } : null;

      if (userData) {
        newSocket.emit('joinLobby', { code: code.toUpperCase(), userData, testMode: isTestMode });
      } else {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/lobby/${code}`)
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              setError(data.error);
            } else {
              setLobby(data);
            }
            setLoading(false);
          })
          .catch(() => {
            setError('Failed to load lobby');
            setLoading(false);
          });
      }
    });

    newSocket.on('lobbyJoined', (lobbyData) => {
      setLobby(lobbyData);
      setLoading(false);
    });

    newSocket.on('lobbyUpdate', (lobbyData) => {
      setLobby(lobbyData);
    });

    newSocket.on('rejoinedLobby', (lobbyData) => {
      setLobby(lobbyData);
      setLoading(false);
    });

    newSocket.on('lobbyClosed', ({ reason }) => {
      alert(reason);
      router.push('/');
    });

    newSocket.on('playerKicked', ({ odiscordId }) => {
      const currentUser = getCurrentUser();
      if (currentUser && odiscordId === currentUser.odiscordId) {
        alert('You have been kicked from the lobby');
        router.push('/');
      }
    });

    newSocket.on('error', (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => {
      newSocket.close();
    };
  }, [code, session]);

  // Test mode: Add fake players
  const addTestPlayers = () => {
    if (!lobby) return;

    const fakeNames = ['ProGamer99', 'ShadowStrike', 'NightOwl', 'ThunderBolt', 'IceQueen', 'FireStorm', 'CoolKid', 'StarPlayer', 'MoonWalker'];
    
    for (let i = 0; i < Math.min(lobby.maxPlayers - lobby.players.length, fakeNames.length); i++) {
      const fakeUser = {
        odiscordId: `fake-${Date.now()}-${i}`,
        username: fakeNames[i],
        avatar: null
      };
      socket.emit('joinLobby', { code: lobby.id, userData: fakeUser, testMode: true });
    }
  };

  // Actions
  const startCaptainSelect = () => {
    socket.emit('startCaptainSelect', { lobbyId: lobby.id });
  };

  const selectCaptain = (odiscordId) => {
    socket.emit('selectCaptain', { lobbyId: lobby.id, odiscordId });
  };

  const draftPick = (odiscordId) => {
    socket.emit('draftPick', { lobbyId: lobby.id, odiscordId });
  };

  const addScore = (team) => {
    socket.emit('addScore', { lobbyId: lobby.id, team });
  };

  const declareWinner = (winnerTeam) => {
    if (confirm(`Are you sure you want to declare ${winnerTeam === 'team1' ? 'Team 1' : 'Team 2'} as the winner?`)) {
      socket.emit('declareWinner', { lobbyId: lobby.id, winnerTeam });
    }
  };

  const resetLobby = () => {
    socket.emit('resetLobby', { lobbyId: lobby.id });
  };

  const closeLobby = () => {
    if (confirm('Are you sure you want to close this lobby?')) {
      socket.emit('closeLobby', { lobbyId: lobby.id });
    }
  };

  const kickPlayer = (odiscordId) => {
    socket.emit('kickPlayer', { lobbyId: lobby.id, odiscordId });
  };

  const leaveLobby = () => {
    socket.emit('leaveLobby', { lobbyId: lobby.id });
    localStorage.removeItem('testMode');
    localStorage.removeItem('testUser');
    router.push('/');
  };

  // Get available players (not captains, not drafted)
  const getAvailablePlayers = () => {
    if (!lobby) return [];
    return lobby.players.filter(p => 
      !lobby.captains.some(c => c.odiscordId === p.odiscordId) &&
      !lobby.teams.team1.some(t => t.odiscordId === p.odiscordId) &&
      !lobby.teams.team2.some(t => t.odiscordId === p.odiscordId)
    );
  };

  // Simple player card component (no stats)
  const PlayerCard = ({ player, onClick, selectable, isCaptain: showCaptainBadge, showKick }) => (
    <div
      onClick={() => selectable && onClick?.(player.odiscordId)}
      className={`
        bg-dark-700 border border-dark-500 rounded-xl p-4
        ${selectable ? 'cursor-pointer hover:scale-105 hover:bg-dark-600' : ''}
        transition-all duration-200 relative
      `}
    >
      {showKick && isHost && player.odiscordId !== lobby.host.odiscordId && (
        <button
          onClick={(e) => { e.stopPropagation(); kickPlayer(player.odiscordId); }}
          className="absolute top-2 right-2 w-6 h-6 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-500 text-xs"
        >
          ✕
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-xl">
            {player.avatar ? (
              <img src={player.avatar} alt="" className="w-full h-full rounded-full" />
            ) : (
              player.username[0].toUpperCase()
            )}
          </div>
          {showCaptainBadge && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs">
              👑
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">
            {player.username}
            {player.odiscordId === lobby?.host?.odiscordId && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(156, 237, 35, 0.3)', color: '#9ced23' }}>HOST</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
          <p className="text-gray-400">Loading lobby...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="font-display text-2xl mb-4">LOBBY NOT FOUND</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button onClick={() => router.push('/')} className="btn-primary">
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="text-gray-400 text-sm mb-1">Lobby Code</div>
              <h1 className="font-display text-4xl flex items-center gap-4">
                <span className="font-mono tracking-widest">{lobby?.id}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(lobby?.id)}
                  className="text-sm bg-dark-700 hover:bg-dark-600 px-3 py-1 rounded-lg text-gray-400"
                >
                  Copy
                </button>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Phase Badge */}
              <div 
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                  lobby?.phase === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                  lobby?.phase === 'drafting' ? 'bg-blue-500/20 text-blue-400' :
                  lobby?.phase === 'playing' ? 'bg-green-500/20 text-green-400' :
                  lobby?.phase === 'finished' ? 'bg-gray-500/20 text-gray-400' : ''
                }`}
                style={lobby?.phase === 'captain-select' ? { backgroundColor: 'rgba(156, 237, 35, 0.2)', color: '#9ced23' } : {}}
              >
                {lobby?.phase === 'waiting' && 'Waiting for Players'}
                {lobby?.phase === 'captain-select' && 'Selecting Captains'}
                {lobby?.phase === 'drafting' && 'Draft in Progress'}
                {lobby?.phase === 'playing' && 'Match in Progress'}
                {lobby?.phase === 'finished' && 'Match Complete'}
              </div>

              {isHost && lobby?.phase === 'waiting' && (
                <button onClick={closeLobby} className="btn-secondary text-red-400 text-sm">
                  Close Lobby
                </button>
              )}

              {!isHost && lobby?.phase === 'waiting' && (
                <button onClick={leaveLobby} className="btn-secondary text-sm">
                  Leave
                </button>
              )}
            </div>
          </div>

          {/* Test Mode Controls */}
          {testMode && lobby?.phase === 'waiting' && isHost && (
            <div className="bg-dark-800 border rounded-xl p-4 mb-6" style={{ borderColor: 'rgba(156, 237, 35, 0.3)' }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: '#9ced23' }}>Test Mode Active</span>
                <button onClick={addTestPlayers} className="btn-secondary text-sm">
                  Add Fake Players
                </button>
              </div>
            </div>
          )}

          {/* WAITING PHASE */}
          {lobby?.phase === 'waiting' && (
            <div className="space-y-6">
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl">PLAYERS ({lobby.players.length}/{lobby.maxPlayers})</h2>
                  {isHost && lobby.players.length >= 4 && (
                    <button onClick={startCaptainSelect} className="btn-primary">
                      Start Game
                    </button>
                  )}
                </div>

                {lobby.players.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lobby.players.map(player => (
                      <PlayerCard key={player.odiscordId} player={player} showKick />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Waiting for players to join...
                  </div>
                )}
              </div>

              {/* Share Code */}
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
                <p className="text-gray-400 mb-4">Share this code with players:</p>
                <div className="font-mono text-4xl font-bold tracking-widest gradient-text">
                  {lobby.id}
                </div>
              </div>
            </div>
          )}

          {/* CAPTAIN SELECT PHASE */}
          {lobby?.phase === 'captain-select' && (
            <div className="space-y-6">
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
                <h2 className="font-display text-2xl mb-2">SELECT CAPTAINS</h2>
                <p className="text-gray-400">
                  {isHost 
                    ? `Click on ${2 - lobby.captains.length} player(s) to make them captain`
                    : 'Host is selecting captains...'
                  }
                </p>
              </div>

              {/* Selected Captains */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-dark-800 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="font-display text-xl text-blue-400 mb-4">TEAM 1 CAPTAIN</h3>
                  {lobby.teams.team1[0] ? (
                    <PlayerCard player={lobby.teams.team1[0]} isCaptain />
                  ) : (
                    <div className="h-20 border-2 border-dashed border-dark-500 rounded-xl flex items-center justify-center text-gray-500">
                      Not selected
                    </div>
                  )}
                </div>
                <div className="bg-dark-800 border border-red-500/30 rounded-xl p-6">
                  <h3 className="font-display text-xl text-red-400 mb-4">TEAM 2 CAPTAIN</h3>
                  {lobby.teams.team2[0] ? (
                    <PlayerCard player={lobby.teams.team2[0]} isCaptain />
                  ) : (
                    <div className="h-20 border-2 border-dashed border-dark-500 rounded-xl flex items-center justify-center text-gray-500">
                      Not selected
                    </div>
                  )}
                </div>
              </div>

              {/* Available Players */}
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
                <h3 className="font-display text-xl mb-4">SELECT A CAPTAIN</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lobby.players.filter(p => !lobby.captains.some(c => c.odiscordId === p.odiscordId)).map(player => (
                    <PlayerCard
                      key={player.odiscordId}
                      player={player}
                      selectable={isHost && lobby.captains.length < 2}
                      onClick={selectCaptain}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DRAFTING PHASE */}
          {lobby?.phase === 'drafting' && (
            <div className="space-y-6">
              {/* Turn Indicator */}
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
                <div className="text-gray-400 mb-2">Current Turn</div>
                <div className={`font-display text-3xl ${lobby.currentTurn === 'team1' ? 'text-blue-400' : 'text-red-400'}`}>
                  {lobby.currentTurn === 'team1' ? 'TEAM 1' : 'TEAM 2'}
                </div>
                <div className="text-gray-500 mt-2">
                  {lobby.picksLeft} pick{lobby.picksLeft !== 1 ? 's' : ''} remaining
                </div>
                {isMyTurn && (
                  <div className="mt-4 text-green-400 font-semibold animate-pulse">
                    It's your turn to pick!
                  </div>
                )}
              </div>

              {/* Teams */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className={`bg-dark-800 border rounded-xl p-6 ${lobby.currentTurn === 'team1' ? 'border-blue-500 glow-blue' : 'border-dark-600'}`}>
                  <h3 className="font-display text-xl text-blue-400 mb-4">TEAM 1</h3>
                  <div className="space-y-3">
                    {lobby.teams.team1.map((player, i) => (
                      <PlayerCard key={player.odiscordId} player={player} isCaptain={i === 0} />
                    ))}
                  </div>
                </div>
                <div className={`bg-dark-800 border rounded-xl p-6 ${lobby.currentTurn === 'team2' ? 'border-red-500 glow-red' : 'border-dark-600'}`}>
                  <h3 className="font-display text-xl text-red-400 mb-4">TEAM 2</h3>
                  <div className="space-y-3">
                    {lobby.teams.team2.map((player, i) => (
                      <PlayerCard key={player.odiscordId} player={player} isCaptain={i === 0} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Available Players */}
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
                <h3 className="font-display text-xl mb-4">AVAILABLE PLAYERS</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {getAvailablePlayers().map(player => (
                    <PlayerCard
                      key={player.odiscordId}
                      player={player}
                      selectable={isMyTurn}
                      onClick={draftPick}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PLAYING / FINISHED PHASE */}
          {(lobby?.phase === 'playing' || lobby?.phase === 'finished') && (
            <div className="space-y-6">
              {/* Score */}
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-8 text-center">
                <div className="text-gray-400 mb-4">
                  {lobby.phase === 'finished' ? 'FINAL SCORE' : 'CURRENT SCORE'}
                </div>
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <div className="font-display text-5xl text-blue-400">{lobby.score.team1}</div>
                    <div className="text-gray-400 mt-2">Team 1</div>
                  </div>
                  <div className="text-4xl text-gray-600">-</div>
                  <div>
                    <div className="font-display text-5xl text-red-400">{lobby.score.team2}</div>
                    <div className="text-gray-400 mt-2">Team 2</div>
                  </div>
                </div>

                {lobby.phase === 'finished' && (
                  <div className="mt-6">
                    <div className={`font-display text-2xl ${lobby.score.team1 > lobby.score.team2 ? 'text-blue-400' : 'text-red-400'}`}>
                      🏆 {lobby.score.team1 > lobby.score.team2 ? 'TEAM 1' : 'TEAM 2'} WINS! 🏆
                    </div>
                  </div>
                )}

                {lobby.phase === 'playing' && isHost && (
                  <div className="mt-6 space-y-4">
                    {/* Round Score Buttons */}
                    <div className="flex justify-center gap-4">
                      <button onClick={() => addScore('team1')} className="btn-secondary">
                        Team 1 Wins Round
                      </button>
                      <button onClick={() => addScore('team2')} className="btn-secondary">
                        Team 2 Wins Round
                      </button>
                    </div>
                    
                    {/* Declare Winner Buttons */}
                    <div className="pt-4 border-t border-dark-600">
                      <p className="text-gray-500 text-sm mb-3">Or declare the match winner directly:</p>
                      <div className="flex justify-center gap-4">
                        <button onClick={() => declareWinner('team1')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm">
                          Team 1 Wins Match
                        </button>
                        <button onClick={() => declareWinner('team2')} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm">
                          Team 2 Wins Match
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {lobby.phase === 'playing' && !isHost && (
                  <div className="mt-6 text-gray-500">
                    Waiting for host to report match result...
                  </div>
                )}

                {lobby.phase === 'finished' && isHost && (
                  <button onClick={resetLobby} className="btn-primary mt-6">
                    Start New Game
                  </button>
                )}
              </div>

              {/* Teams */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-dark-800 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="font-display text-xl text-blue-400 mb-4">TEAM 1</h3>
                  <div className="space-y-3">
                    {lobby.teams.team1.map((player, i) => (
                      <PlayerCard key={player.odiscordId} player={player} isCaptain={i === 0} />
                    ))}
                  </div>
                </div>
                <div className="bg-dark-800 border border-red-500/30 rounded-xl p-6">
                  <h3 className="font-display text-xl text-red-400 mb-4">TEAM 2</h3>
                  <div className="space-y-3">
                    {lobby.teams.team2.map((player, i) => (
                      <PlayerCard key={player.odiscordId} player={player} isCaptain={i === 0} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
