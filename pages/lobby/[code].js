import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
  const [vcStatus, setVcStatus] = useState({ playersInVC: [], allInVC: false });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Purge state
  const [purgeActive, setPurgeActive] = useState(false);
  const [purgeCountdown, setPurgeCountdown] = useState(5);
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [purgeComplete, setPurgeComplete] = useState(false);
  const [isSurvivor, setIsSurvivor] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);
  const [immunePlayers, setImmunePlayers] = useState([]);
  const [hasImmunityNextTime, setHasImmunityNextTime] = useState(false);

  // Market state
  const [auctionPlayer, setAuctionPlayer] = useState(null);
  const [auctionTimer, setAuctionTimer] = useState(30);
  const [currentBids, setCurrentBids] = useState({ team1: 0, team2: 0 });
  const [team1Budget, setTeam1Budget] = useState(1000);
  const [team2Budget, setTeam2Budget] = useState(1000);
  const [bidAmount, setBidAmount] = useState(0);
  const [auctionWinner, setAuctionWinner] = useState(null);

  // Sound refs
  const countdownSound = typeof Audio !== 'undefined' ? new Audio('/purge-countdown.mp3') : null;
  const eliminatedSound = typeof Audio !== 'undefined' ? new Audio('/purge-eliminated.mp3') : null;
  const survivedSound = typeof Audio !== 'undefined' ? new Audio('/purge-survived.mp3') : null;
  const draftPickSound = typeof Audio !== 'undefined' ? new Audio('/draft-pick.mp3') : null;
  const bidSound = typeof Audio !== 'undefined' ? new Audio('/bid.mp3') : null;
  const auctionWonSound = typeof Audio !== 'undefined' ? new Audio('/auction-won.mp3') : null;

  const getCurrentUser = useCallback(() => {
    if (session) {
      return {
        odiscordId: session.user.discordId,
        username: session.user.name,
        avatar: session.user.image
      };
    }
    return null;
  }, [session]);

  const isHost = lobby && getCurrentUser() && lobby.host.odiscordId === getCurrentUser().odiscordId;

  const isMyTurn = lobby && lobby.phase === 'drafting' && getCurrentUser() && (() => {
    const currentCaptain = lobby.currentTurn === 'team1' ? lobby.teams.team1[0] : lobby.teams.team2[0];
    return currentCaptain && currentCaptain.odiscordId === getCurrentUser().odiscordId;
  })();

  // Connect to socket
  useEffect(() => {
    if (!code) return;

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      const userData = session ? {
        odiscordId: session.user.discordId,
        username: session.user.name,
        avatar: session.user.image
      } : null;

      if (userData) {
        newSocket.emit('joinLobby', { code: code.toUpperCase(), userData });
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

    newSocket.on('draftPick', ({ player, team }) => {
      // Play draft pick sound
      if (draftPickSound) {
        draftPickSound.currentTime = 0;
        draftPickSound.play().catch(() => {});
      }
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

    newSocket.on('vcStatus', (status) => {
      setVcStatus(status);
    });

    // Purge events
    newSocket.on('purgeStart', ({ totalPlayers, targetPlayers, toEliminate }) => {
      setPurgeActive(true);
      setPurgeCountdown(5);
      setEliminatedPlayers([]);
      setPurgeComplete(false);
      setIsSurvivor(false);
      setIsEliminated(false);
      setImmunePlayers([]);
      setHasImmunityNextTime(false);
      
      // Play countdown sound
      if (countdownSound) {
        countdownSound.play().catch(() => {});
      }
      
      // Countdown timer
      let count = 5;
      const countdownInterval = setInterval(() => {
        count--;
        setPurgeCountdown(count);
        if (count <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
    });

    newSocket.on('immunityUsed', ({ players }) => {
      setImmunePlayers(players);
    });

    newSocket.on('playerEliminated', ({ player, index, total, hasImmunity }) => {
      setEliminatedPlayers(prev => [...prev, player]);
      
      // Play elimination sound
      if (eliminatedSound) {
        eliminatedSound.currentTime = 0;
        eliminatedSound.play().catch(() => {});
      }
      
      // Check if current user was eliminated
      const currentUser = session?.user?.discordId;
      if (currentUser && player.odiscordId === currentUser) {
        setIsEliminated(true);
        if (hasImmunity) {
          setHasImmunityNextTime(true);
        }
      }
    });

    newSocket.on('purgeComplete', ({ survivors }) => {
      setPurgeComplete(true);
      setPurgeActive(false);
      
      // Check if current user survived
      const currentUser = session?.user?.discordId;
      if (currentUser && survivors.some(p => p.odiscordId === currentUser)) {
        setIsSurvivor(true);
        // Play survived sound
        if (survivedSound) {
          survivedSound.play().catch(() => {});
        }
      } else if (currentUser && isEliminated) {
        // Eliminated player gets redirected after delay
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
      
      // Reset purge state after a delay
      setTimeout(() => {
        setEliminatedPlayers([]);
        setPurgeComplete(false);
        setIsSurvivor(false);
      }, 3000);
    });

    // Market mode events
    newSocket.on('auctionStart', ({ player, timerEnd, team1Budget: t1, team2Budget: t2, playersRemaining }) => {
      setAuctionPlayer(player);
      setAuctionWinner(null);
      setCurrentBids({ team1: 0, team2: 0 });
      setTeam1Budget(t1);
      setTeam2Budget(t2);
      setBidAmount(0);
      
      // Start countdown timer
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
        setAuctionTimer(remaining);
        if (remaining > 0) {
          setTimeout(updateTimer, 100);
        }
      };
      updateTimer();
    });

    newSocket.on('bidUpdate', ({ team, amount, currentBids: bids }) => {
      setCurrentBids(bids);
      if (bidSound) {
        bidSound.currentTime = 0;
        bidSound.play().catch(() => {});
      }
    });

    newSocket.on('auctionEnd', ({ player, winningTeam, winningBid, team1Budget: t1, team2Budget: t2 }) => {
      setAuctionWinner({ player, winningTeam, winningBid });
      setTeam1Budget(t1);
      setTeam2Budget(t2);
      
      if (auctionWonSound) {
        auctionWonSound.play().catch(() => {});
      }
      
      // Clear auction player after delay
      setTimeout(() => {
        setAuctionPlayer(null);
        setAuctionWinner(null);
      }, 2000);
    });

    newSocket.on('error', (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => {
      newSocket.close();
    };
  }, [code, session]);

  // Check VC status periodically for public lobbies
  useEffect(() => {
    if (!socket || !lobby || !lobby.isPublic || lobby.phase !== 'waiting') return;

    const checkVC = () => {
      socket.emit('checkVCStatus', { lobbyId: lobby.id });
    };

    checkVC();
    const interval = setInterval(checkVC, 5000);
    return () => clearInterval(interval);
  }, [socket, lobby?.id, lobby?.isPublic, lobby?.phase]);

  // Actions
  const startCaptainSelect = () => socket.emit('startCaptainSelect', { lobbyId: lobby.id });
  const selectCaptain = (odiscordId) => socket.emit('selectCaptain', { lobbyId: lobby.id, odiscordId });
  const removeCaptain = (odiscordId) => socket.emit('removeCaptain', { lobbyId: lobby.id, odiscordId });
  const draftPick = (odiscordId) => socket.emit('draftPick', { lobbyId: lobby.id, odiscordId });
  const placeBid = (amount) => socket.emit('placeBid', { lobbyId: lobby.id, amount });
  const addScore = (team) => socket.emit('addScore', { lobbyId: lobby.id, team });
  const declareWinner = (winnerTeam) => {
    if (confirm(`Declare ${winnerTeam === 'team1' ? 'Team 1' : 'Team 2'} as winner?`)) {
      socket.emit('declareWinner', { lobbyId: lobby.id, winnerTeam });
    }
  };
  const resetLobby = () => socket.emit('resetLobby', { lobbyId: lobby.id });
  const closeLobby = () => {
    if (confirm('Close this lobby?')) {
      socket.emit('closeLobby', { lobbyId: lobby.id });
    }
  };
  const kickPlayer = (odiscordId) => socket.emit('kickPlayer', { lobbyId: lobby.id, odiscordId });
  const leaveLobby = () => {
    socket.emit('leaveLobby', { lobbyId: lobby.id });
    router.push('/');
  };

  const getAvailablePlayers = () => {
    if (!lobby) return [];
    return lobby.players.filter(p => 
      !lobby.captains.some(c => c.odiscordId === p.odiscordId) &&
      !lobby.teams.team1.some(t => t.odiscordId === p.odiscordId) &&
      !lobby.teams.team2.some(t => t.odiscordId === p.odiscordId)
    );
  };

  // Player Card Component
  const PlayerCard = ({ player, onClick, selectable, isCaptain: showCaptainBadge, showKick }) => {
    const isInVC = vcStatus.playersInVC?.includes(player.odiscordId);
    
    return (
      <div
        onClick={() => selectable ? onClick?.(player.odiscordId) : setSelectedPlayer(player)}
        className={`bg-dark-700 border border-dark-500 rounded-xl p-4 cursor-pointer
          ${selectable ? 'hover:scale-105 hover:bg-dark-600' : 'hover:bg-dark-650'}
          transition-all duration-200 relative`}
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
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs">👑</div>
            )}
            {lobby?.isPublic && lobby?.phase === 'waiting' && (
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${isInVC ? 'bg-green-500' : 'bg-red-500'}`} title={isInVC ? 'In VC' : 'Not in VC'} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">
              {player.username}
              {player.odiscordId === lobby?.host?.odiscordId && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(156, 237, 35, 0.3)', color: '#9ced23' }}>HOST</span>
              )}
            </div>
            <div className="text-xs text-gray-500">Click to view profile</div>
          </div>
        </div>
      </div>
    );
  };

  // Player Modal
  const PlayerModal = ({ player, onClose }) => {
    const [playerData, setPlayerData] = useState(null);
    const [loadingPlayer, setLoadingPlayer] = useState(true);

    useEffect(() => {
      const fetchPlayer = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/players/${player.odiscordId}`);
          if (res.ok) {
            const data = await res.json();
            setPlayerData(data);
          }
        } catch (e) {
          console.error('Failed to fetch player:', e);
        }
        setLoadingPlayer(false);
      };
      fetchPlayer();
    }, [player.odiscordId]);

    const getRankBg = (rank) => {
      const colors = {
        S: 'from-yellow-500 to-amber-600',
        A: 'from-purple-500 to-violet-600',
        B: 'from-blue-500 to-indigo-600',
        C: 'from-emerald-500 to-green-600',
        D: 'from-orange-500 to-red-600',
        F: 'from-gray-500 to-gray-600'
      };
      return colors[rank] || 'from-gray-500 to-gray-600';
    };

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
          {loadingPlayer ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
            </div>
          ) : playerData ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-dark-600 flex items-center justify-center text-2xl">
                    {playerData.avatar ? (
                      <img src={playerData.avatar} alt="" className="w-full h-full rounded-full" />
                    ) : (
                      playerData.username[0].toUpperCase()
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-gradient-to-br ${getRankBg(playerData.rank)} flex items-center justify-center font-display text-sm`}>
                    {playerData.rank}
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-xl">{playerData.username}</h3>
                  <div className="text-gray-400 font-mono">{playerData.elo} ELO</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-dark-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{playerData.wins}</div>
                  <div className="text-xs text-gray-500">Wins</div>
                </div>
                <div className="bg-dark-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-red-400">{playerData.losses}</div>
                  <div className="text-xs text-gray-500">Losses</div>
                </div>
                <div className="bg-dark-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {playerData.gamesPlayed > 0 ? Math.round((playerData.wins / playerData.gamesPlayed) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-500">Win Rate</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href={`/player/${playerData.odiscordId}`} className="flex-1 btn-primary text-center">
                  Full Profile
                </Link>
                <button onClick={onClose} className="flex-1 btn-secondary">Close</button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No stats yet</p>
              <button onClick={onClose} className="btn-secondary mt-4">Close</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
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
          <div className="text-6xl mb-4">😕</div>
          <h1 className="font-display text-2xl mb-4">LOBBY NOT FOUND</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      {selectedPlayer && <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="text-gray-400 text-sm mb-1">Lobby Code</div>
              <h1 className="font-display text-4xl flex items-center gap-4">
                <span className="font-mono tracking-widest">{lobby?.id}</span>
                <button onClick={() => navigator.clipboard.writeText(lobby?.id)} className="text-sm bg-dark-700 hover:bg-dark-600 px-3 py-1 rounded-lg text-gray-400">Copy</button>
              </h1>
              {lobby?.isPublic && <span className="text-xs text-green-400">Public Lobby</span>}
            </div>

            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                lobby?.phase === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                lobby?.phase === 'drafting' ? 'bg-blue-500/20 text-blue-400' :
                lobby?.phase === 'market' ? 'bg-yellow-500/20 text-yellow-400' :
                lobby?.phase === 'playing' ? 'bg-green-500/20 text-green-400' :
                lobby?.phase === 'finished' ? 'bg-gray-500/20 text-gray-400' : ''
              }`} style={lobby?.phase === 'captain-select' ? { backgroundColor: 'rgba(156, 237, 35, 0.2)', color: '#9ced23' } : {}}>
                {lobby?.phase === 'waiting' && 'Waiting for Players'}
                {lobby?.phase === 'captain-select' && 'Selecting Captains'}
                {lobby?.phase === 'drafting' && 'Draft in Progress'}
                {lobby?.phase === 'market' && '💰 Market in Progress'}
                {lobby?.phase === 'playing' && 'Match in Progress'}
                {lobby?.phase === 'finished' && 'Match Complete'}
              </div>

              {isHost && lobby?.phase !== 'finished' && (
                <button onClick={closeLobby} className="btn-secondary text-red-400 text-sm">Close Lobby</button>
              )}
              {!isHost && lobby?.phase === 'waiting' && (
                <button onClick={leaveLobby} className="btn-secondary text-sm">Leave</button>
              )}
            </div>
          </div>

          {/* VC Status Warning for Public Lobbies */}
          {lobby?.isPublic && lobby?.phase === 'waiting' && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎤</span>
                <div>
                  <div className="font-semibold text-blue-400">Join Voice Channel</div>
                  <div className="text-sm text-blue-300/70">
                    Join <span className="font-mono font-bold text-white">🎮 Lobby {lobby.id}</span> in Discord to play.
                    {!vcStatus.allInVC && (
                      <span className="ml-2 text-yellow-400">({vcStatus.playersInVC.length}/{lobby.players.length} in VC)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WAITING PHASE */}
          {lobby?.phase === 'waiting' && (
            <div className="space-y-6">
              {/* Draft Mode Indicator */}
              <div className={`rounded-xl p-4 text-center ${lobby.draftMode === 'market' ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-blue-500/20 border border-blue-500/30'}`}>
                <span className="text-2xl mr-2">{lobby.draftMode === 'market' ? '💰' : '🎯'}</span>
                <span className={`font-display text-lg ${lobby.draftMode === 'market' ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {lobby.draftMode === 'market' ? 'MARKET MODE' : 'DRAFT MODE'}
                </span>
                <p className="text-sm text-gray-400 mt-1">
                  {lobby.draftMode === 'market' ? 'Captains will bid coins on players' : 'Captains will take turns picking players'}
                </p>
              </div>

              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl">
                    PLAYERS ({lobby.players.length})
                    {lobby.players.length > lobby.maxPlayers && (
                      <span className="text-red-400 text-sm ml-2">⚠️ {lobby.players.length - lobby.maxPlayers} will be purged!</span>
                    )}
                  </h2>
                  {isHost && lobby.players.length >= 4 && (
                    <button 
                      onClick={startCaptainSelect} 
                      className="btn-primary"
                      disabled={lobby.isPublic && !vcStatus.allInVC}
                    >
                      {lobby.isPublic && !vcStatus.allInVC ? 'Waiting for VC...' : 
                        lobby.players.length > lobby.maxPlayers ? `Start Purge (${lobby.maxPlayers} spots)` : 'Start Game'}
                    </button>
                  )}
                </div>

                {lobby.players.length > lobby.maxPlayers && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm">
                      ⚡ <strong>PURGE MODE:</strong> {lobby.players.length - lobby.maxPlayers} random player{lobby.players.length - lobby.maxPlayers > 1 ? 's' : ''} will be eliminated when the game starts!
                    </p>
                  </div>
                )}

                {lobby.players.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lobby.players.map(player => (
                      <PlayerCard key={player.odiscordId} player={player} showKick />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">Waiting for players...</div>
                )}
              </div>

              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
                <p className="text-gray-400 mb-4">Share this code:</p>
                <div className="font-mono text-4xl font-bold tracking-widest gradient-text">{lobby.id}</div>
              </div>
            </div>
          )}

          {/* PURGE PHASE */}
          {(lobby?.phase === 'purging' || purgeActive) && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
              <div className="text-center max-w-3xl px-4">
                {purgeCountdown > 0 && !purgeComplete && (
                  <>
                    <div className="text-red-500 font-display text-6xl mb-4 animate-pulse">⚡ THE PURGE ⚡</div>
                    <div className="text-9xl font-display text-white mb-4">{purgeCountdown}</div>
                    <p className="text-red-400 text-xl">{lobby?.purgeData?.originalCount - lobby?.purgeData?.targetCount} players will be eliminated...</p>
                    
                    {/* Show immune players */}
                    {immunePlayers.length > 0 && (
                      <div className="mt-6 bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                        <div className="text-green-400 font-semibold mb-2">🛡️ IMMUNE PLAYERS</div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {immunePlayers.map(p => (
                            <span key={p.odiscordId} className="px-3 py-1 bg-green-500/30 rounded-full text-green-300">
                              {p.username}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {purgeCountdown <= 0 && !purgeComplete && (
                  <div className="space-y-6">
                    <div className="text-red-500 font-display text-4xl animate-pulse">ELIMINATING...</div>
                    <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
                      {eliminatedPlayers.map((player, i) => (
                        <div key={player.odiscordId} className="bg-red-500/30 border border-red-500 rounded-xl p-4 animate-bounce">
                          <img src={player.avatar || `https://ui-avatars.com/api/?name=${player.username}`} className="w-16 h-16 rounded-full mx-auto mb-2 opacity-50" />
                          <div className="text-red-400 font-semibold">{player.username}</div>
                          <div className="text-red-500 text-xs">ELIMINATED</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {purgeComplete && (
                  <div className="space-y-6">
                    {isSurvivor && (
                      <>
                        <div className="text-green-500 font-display text-6xl">🎉 YOU SURVIVED! 🎉</div>
                        <p className="text-green-400 text-xl">Prepare for battle!</p>
                      </>
                    )}
                    {isEliminated && (
                      <>
                        <div className="text-red-500 font-display text-6xl">💀 ELIMINATED 💀</div>
                        <p className="text-red-400 text-xl">Better luck next time...</p>
                        {hasImmunityNextTime && (
                          <div className="mt-4 bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                            <div className="text-green-400 font-semibold">🛡️ IMMUNITY GRANTED</div>
                            <p className="text-green-300 text-sm">You cannot be purged in the next lobby!</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CAPTAIN SELECT PHASE */}
          {lobby?.phase === 'captain-select' && (
            <div className="space-y-6">
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
                <h2 className="font-display text-2xl mb-2">SELECT CAPTAINS</h2>
                <p className="text-gray-400">
                  {isHost ? `Click on ${2 - lobby.captains.length} player(s) to make them captain` : 'Host is selecting captains...'}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-dark-800 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="font-display text-xl text-blue-400 mb-4">TEAM 1 CAPTAIN</h3>
                  {lobby.teams.team1[0] ? (
                    <div className="relative">
                      <PlayerCard player={lobby.teams.team1[0]} isCaptain />
                      {isHost && (
                        <button
                          onClick={() => removeCaptain(lobby.teams.team1[0].odiscordId)}
                          className="absolute top-2 right-2 px-2 py-1 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="h-20 border-2 border-dashed border-dark-500 rounded-xl flex items-center justify-center text-gray-500">Not selected</div>
                  )}
                </div>
                <div className="bg-dark-800 border border-red-500/30 rounded-xl p-6">
                  <h3 className="font-display text-xl text-red-400 mb-4">TEAM 2 CAPTAIN</h3>
                  {lobby.teams.team2[0] ? (
                    <div className="relative">
                      <PlayerCard player={lobby.teams.team2[0]} isCaptain />
                      {isHost && (
                        <button
                          onClick={() => removeCaptain(lobby.teams.team2[0].odiscordId)}
                          className="absolute top-2 right-2 px-2 py-1 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="h-20 border-2 border-dashed border-dark-500 rounded-xl flex items-center justify-center text-gray-500">Not selected</div>
                  )}
                </div>
              </div>

              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
                <h3 className="font-display text-xl mb-4">SELECT A CAPTAIN</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lobby.players.filter(p => !lobby.captains.some(c => c.odiscordId === p.odiscordId)).map(player => (
                    <PlayerCard key={player.odiscordId} player={player} selectable={isHost && lobby.captains.length < 2} onClick={selectCaptain} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DRAFTING PHASE */}
          {lobby?.phase === 'drafting' && (
            <div className="space-y-6">
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
                <div className="text-gray-400 mb-2">Current Turn</div>
                <div className={`font-display text-3xl ${lobby.currentTurn === 'team1' ? 'text-blue-400' : 'text-red-400'}`}>
                  {lobby.currentTurn === 'team1' ? 'TEAM 1' : 'TEAM 2'}
                </div>
                <div className="text-gray-500 mt-2">{lobby.picksLeft} pick{lobby.picksLeft !== 1 ? 's' : ''} remaining</div>
                {isMyTurn && <div className="mt-4 text-green-400 font-semibold animate-pulse">It's your turn to pick!</div>}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className={`bg-dark-800 border rounded-xl p-6 ${lobby.currentTurn === 'team1' ? 'border-blue-500' : 'border-dark-600'}`}>
                  <h3 className="font-display text-xl text-blue-400 mb-4">TEAM 1</h3>
                  <div className="space-y-3">
                    {lobby.teams.team1.map((player, i) => (
                      <PlayerCard key={player.odiscordId} player={player} isCaptain={i === 0} />
                    ))}
                  </div>
                </div>
                <div className={`bg-dark-800 border rounded-xl p-6 ${lobby.currentTurn === 'team2' ? 'border-red-500' : 'border-dark-600'}`}>
                  <h3 className="font-display text-xl text-red-400 mb-4">TEAM 2</h3>
                  <div className="space-y-3">
                    {lobby.teams.team2.map((player, i) => (
                      <PlayerCard key={player.odiscordId} player={player} isCaptain={i === 0} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
                <h3 className="font-display text-xl mb-4">AVAILABLE PLAYERS</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {getAvailablePlayers().map(player => (
                    <PlayerCard key={player.odiscordId} player={player} selectable={isMyTurn} onClick={draftPick} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MARKET PHASE */}
          {lobby?.phase === 'market' && (
            <div className="space-y-6">
              {/* Budgets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 text-center">
                  <div className="text-blue-400 text-sm">Team 1 Budget</div>
                  <div className="font-display text-3xl text-blue-400">💰 {team1Budget}</div>
                </div>
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
                  <div className="text-red-400 text-sm">Team 2 Budget</div>
                  <div className="font-display text-3xl text-red-400">💰 {team2Budget}</div>
                </div>
              </div>

              {/* Current Auction */}
              {auctionPlayer && !auctionWinner && (
                <div className="bg-dark-800 border border-yellow-500/50 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <div className="text-yellow-400 text-sm mb-2">NOW BIDDING</div>
                    <div className={`inline-block px-4 py-2 rounded-full text-2xl font-display ${
                      auctionTimer <= 5 ? 'bg-red-500/30 text-red-400 animate-pulse' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      ⏱️ {auctionTimer}s
                    </div>
                  </div>

                  {/* Player Card */}
                  <div className="bg-dark-700 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-dark-600 overflow-hidden">
                        {auctionPlayer.avatar ? (
                          <img src={auctionPlayer.avatar} alt="" className="w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {auctionPlayer.username[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-display text-2xl mb-2">{auctionPlayer.username}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">ELO</div>
                            <div className="font-mono text-lg">{auctionPlayer.elo}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Rank</div>
                            <div className="font-display text-lg">{auctionPlayer.rank}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">KDR</div>
                            <div className="font-mono text-lg text-green-400">{auctionPlayer.kdr}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Leaderboard</div>
                            <div className="font-mono text-lg">#{auctionPlayer.leaderboardRank}</div>
                          </div>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm">
                          <div><span className="text-gray-500">Kills:</span> <span className="text-green-400">{auctionPlayer.totalKills}</span></div>
                          <div><span className="text-gray-500">Deaths:</span> <span className="text-red-400">{auctionPlayer.totalDeaths}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Bids */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-xl text-center ${currentBids.team1 >= currentBids.team2 && currentBids.team1 > 0 ? 'bg-blue-500/30 border-2 border-blue-500' : 'bg-dark-700'}`}>
                      <div className="text-blue-400 text-sm">Team 1 Bid</div>
                      <div className="font-display text-3xl">{currentBids.team1}</div>
                    </div>
                    <div className={`p-4 rounded-xl text-center ${currentBids.team2 > currentBids.team1 ? 'bg-red-500/30 border-2 border-red-500' : 'bg-dark-700'}`}>
                      <div className="text-red-400 text-sm">Team 2 Bid</div>
                      <div className="font-display text-3xl">{currentBids.team2}</div>
                    </div>
                  </div>

                  {/* Bid Controls - Only for captains */}
                  {(lobby.teams.team1[0]?.odiscordId === getCurrentUser()?.odiscordId || 
                    lobby.teams.team2[0]?.odiscordId === getCurrentUser()?.odiscordId) && (
                    <div className="bg-dark-700 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="Enter bid amount"
                          className="flex-1 px-4 py-3 bg-dark-600 rounded-lg text-center font-mono text-xl"
                          min="0"
                          max={lobby.teams.team1[0]?.odiscordId === getCurrentUser()?.odiscordId ? team1Budget : team2Budget}
                        />
                        <button 
                          onClick={() => placeBid(bidAmount)}
                          className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-all"
                        >
                          BID 💰
                        </button>
                      </div>
                      <div className="flex justify-center gap-2 mt-3">
                        {[10, 25, 50, 100, 200].map(amt => (
                          <button
                            key={amt}
                            onClick={() => setBidAmount(bidAmount + amt)}
                            className="px-3 py-1 bg-dark-600 hover:bg-dark-500 rounded text-sm"
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auction Winner */}
              {auctionWinner && (
                <div className="bg-dark-800 border border-green-500 rounded-xl p-6 text-center">
                  <div className="text-green-400 font-display text-2xl mb-2">SOLD!</div>
                  <div className="text-xl">
                    <span className="font-semibold">{auctionWinner.player.username}</span> goes to{' '}
                    <span className={auctionWinner.winningTeam === 'team1' ? 'text-blue-400' : 'text-red-400'}>
                      {auctionWinner.winningTeam === 'team1' ? 'Team 1' : 'Team 2'}
                    </span>
                    {' '}for <span className="text-yellow-400">{auctionWinner.winningBid} coins</span>
                  </div>
                </div>
              )}

              {/* Teams */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-dark-800 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="font-display text-xl text-blue-400 mb-4">TEAM 1 ({lobby.teams.team1.length}/{lobby.maxPlayers / 2})</h3>
                  <div className="space-y-3">
                    {lobby.teams.team1.map((player, i) => (
                      <PlayerCard key={player.odiscordId} player={player} isCaptain={i === 0} />
                    ))}
                  </div>
                </div>
                <div className="bg-dark-800 border border-red-500/30 rounded-xl p-6">
                  <h3 className="font-display text-xl text-red-400 mb-4">TEAM 2 ({lobby.teams.team2.length}/{lobby.maxPlayers / 2})</h3>
                  <div className="space-y-3">
                    {lobby.teams.team2.map((player, i) => (
                      <PlayerCard key={player.odiscordId} player={player} isCaptain={i === 0} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PLAYING / FINISHED PHASE */}
          {(lobby?.phase === 'playing' || lobby?.phase === 'finished') && (
            <div className="space-y-6">
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-8 text-center">
                {lobby.phase === 'playing' && (
                  <>
                    <div className="text-gray-400 mb-4">MATCH IN PROGRESS</div>
                    <div className="text-6xl mb-6">⚔️</div>
                    
                    {isHost ? (
                      <div className="space-y-4">
                        <p className="text-gray-400 mb-4">Select the winning team:</p>
                        <div className="flex justify-center gap-4">
                          <button onClick={() => declareWinner('team1')} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold transition-all hover:scale-105">
                            🔵 Team 1 Wins
                          </button>
                          <button onClick={() => declareWinner('team2')} className="px-8 py-4 bg-red-600 hover:bg-red-500 rounded-xl text-lg font-semibold transition-all hover:scale-105">
                            🔴 Team 2 Wins
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">Waiting for host to report match result...</div>
                    )}
                  </>
                )}

                {lobby.phase === 'finished' && (
                  <>
                    <div className={`font-display text-3xl mb-4 ${lobby.score.team1 > lobby.score.team2 ? 'text-blue-400' : 'text-red-400'}`}>
                      🏆 {lobby.score.team1 > lobby.score.team2 ? 'TEAM 1' : 'TEAM 2'} WINS! 🏆
                    </div>
                    {isHost && (
                      <button onClick={resetLobby} className="btn-primary mt-4">Start New Game</button>
                    )}
                  </>
                )}
              </div>

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
