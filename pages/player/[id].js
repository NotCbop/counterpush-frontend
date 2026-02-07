import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

export default function PlayerProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchPlayer = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/players/${id}`);
        if (!res.ok) throw new Error('Player not found');
        const data = await res.json();
        setPlayer(data);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };

    fetchPlayer();
  }, [id]);

  const getRankColor = (rank) => {
    const colors = {
      S: 'text-yellow-400',
      A: 'text-purple-400',
      B: 'text-blue-400',
      C: 'text-green-400',
      D: 'text-orange-400',
      F: 'text-gray-400'
    };
    return colors[rank] || 'text-gray-400';
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="font-display text-2xl mb-4">Player Not Found</h1>
          <Link href="/leaderboard" className="btn-primary">Back to Leaderboard</Link>
        </div>
      </div>
    );
  }

  const winRate = player.gamesPlayed > 0 ? Math.round((player.wins / player.gamesPlayed) * 100) : 0;

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Player Header */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-dark-600 flex items-center justify-center text-5xl">
                  {player.avatar ? (
                    <img src={player.avatar} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    player.username[0].toUpperCase()
                  )}
                </div>
                <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-gradient-to-br ${getRankBg(player.rank)} flex items-center justify-center font-display text-xl`}>
                  {player.rank}
                </div>
              </div>
              
              <div className="text-center md:text-left flex-1">
                <h1 className="font-display text-4xl mb-2">{player.username}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400">
                  <span className={`font-display text-2xl ${getRankColor(player.rank)}`}>{player.rank} Rank</span>
                  <span>•</span>
                  <span className="font-mono text-xl">{player.elo} ELO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold" style={{ color: '#9ced23' }}>{player.gamesPlayed}</div>
              <div className="text-gray-400 text-sm">Games Played</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400">{player.wins}</div>
              <div className="text-gray-400 text-sm">Wins</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-red-400">{player.losses}</div>
              <div className="text-gray-400 text-sm">Losses</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-400">{winRate}%</div>
              <div className="text-gray-400 text-sm">Win Rate</div>
            </div>
          </div>

          {/* Combat Stats */}
          {(player.totalKills > 0 || player.totalDeaths > 0) && (
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-8">
              <h2 className="font-display text-xl mb-4">COMBAT STATS</h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{player.totalKills || 0}</div>
                  <div className="text-gray-500 text-xs">Kills</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{player.totalDeaths || 0}</div>
                  <div className="text-gray-500 text-xs">Deaths</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{player.totalAssists || 0}</div>
                  <div className="text-gray-500 text-xs">Assists</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{player.kdr || '0.00'}</div>
                  <div className="text-gray-500 text-xs">KDR</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{player.totalDamage || 0}</div>
                  <div className="text-gray-500 text-xs">Damage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">{player.totalHealing || 0}</div>
                  <div className="text-gray-500 text-xs">Healing</div>
                </div>
              </div>
            </div>
          )}

          {/* Match History */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6">
            <h2 className="font-display text-2xl mb-6">MATCH HISTORY</h2>
            
            {player.recentMatches && player.recentMatches.length > 0 ? (
              <div className="space-y-4">
                {player.recentMatches.map((match, i) => {
                  const isWinner = match.winners?.some(p => p.odiscordId === player.odiscordId);
                  const playerResult = isWinner 
                    ? match.winners.find(p => p.odiscordId === player.odiscordId)
                    : match.losers?.find(p => p.odiscordId === player.odiscordId);
                  
                  const matchDate = new Date(match.timestamp);
                  
                  return (
                    <div key={match.id || i} className={`bg-dark-700 border rounded-xl p-4 ${isWinner ? 'border-green-500/30' : 'border-red-500/30'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${isWinner ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {isWinner ? 'WIN' : 'LOSS'}
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">
                              {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-500">Lobby: {match.lobbyId}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {playerResult && (
                            <div className={`font-mono text-lg ${playerResult.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {playerResult.change >= 0 ? '+' : ''}{playerResult.change} ELO
                            </div>
                          )}
                          {playerResult && (
                            <div className="text-xs text-gray-500">
                              {playerResult.oldElo} → {playerResult.newElo}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Show player's match stats if available */}
                      {playerResult?.stats && (
                        <div className="mt-3 pt-3 border-t border-dark-600 flex flex-wrap gap-4 text-sm">
                          <div><span className="text-gray-500">K:</span> <span className="text-green-400">{playerResult.stats.kills || 0}</span></div>
                          <div><span className="text-gray-500">D:</span> <span className="text-red-400">{playerResult.stats.deaths || 0}</span></div>
                          <div><span className="text-gray-500">A:</span> <span className="text-blue-400">{playerResult.stats.assists || 0}</span></div>
                          <div><span className="text-gray-500">DMG:</span> <span className="text-orange-400">{playerResult.stats.damage || 0}</span></div>
                          <div><span className="text-gray-500">HEAL:</span> <span className="text-pink-400">{playerResult.stats.healing || 0}</span></div>
                        </div>
                      )}
                      
                      {/* Show other players in match */}
                      <div className={`mt-3 pt-3 border-t border-dark-600 grid md:grid-cols-2 gap-4 ${playerResult?.stats ? '' : ''}`}>
                        <div>
                          <div className="text-xs text-green-400 mb-1">Winners</div>
                          <div className="flex flex-wrap gap-1">
                            {match.winners?.map(p => (
                              <Link 
                                key={p.odiscordId} 
                                href={`/player/${p.odiscordId}`}
                                className={`text-xs px-2 py-1 rounded ${p.odiscordId === player.odiscordId ? 'bg-green-500/30 text-green-300' : 'bg-dark-600 text-gray-400 hover:bg-dark-500'}`}
                              >
                                {p.username}
                              </Link>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-red-400 mb-1">Losers</div>
                          <div className="flex flex-wrap gap-1">
                            {match.losers?.map(p => (
                              <Link 
                                key={p.odiscordId} 
                                href={`/player/${p.odiscordId}`}
                                className={`text-xs px-2 py-1 rounded ${p.odiscordId === player.odiscordId ? 'bg-red-500/30 text-red-300' : 'bg-dark-600 text-gray-400 hover:bg-dark-500'}`}
                              >
                                {p.username}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">🎮</div>
                <p>No matches played yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
