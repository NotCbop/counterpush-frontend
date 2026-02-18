import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

// Rank icons - you can replace these with custom image paths
const RANK_ICONS = {
  Netherite: '/ranks/netherite.png',
  Diamond: '/ranks/diamond.png',
  Amethyst: '/ranks/amethyst.png',
  Emerald: '/ranks/emerald.png',
  Gold: '/ranks/gold.png',
  Iron: '/ranks/iron.png',
  Copper: '/ranks/copper.png'
};

// Class icons - custom images instead of emojis
const CLASS_ICONS = {
  Tank: '/classes/tank.png',
  Brawler: '/classes/brawler.png',
  Sniper: '/classes/sniper.png',
  Trickster: '/classes/trickster.png',
  Support: '/classes/support.png'
};

// Class icon component
const ClassIcon = ({ classType, size = 'w-5 h-5' }) => {
  if (!classType || !CLASS_ICONS[classType]) return null;
  return (
    <img 
      src={CLASS_ICONS[classType]} 
      alt={classType}
      className={`${size} object-contain`}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
};

export default function PlayerProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

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
      Netherite: 'text-gray-300',
      Diamond: 'text-cyan-400',
      Amethyst: 'text-purple-400',
      Emerald: 'text-green-400',
      Gold: 'text-yellow-400',
      Iron: 'text-gray-400',
      Copper: 'text-orange-400'
    };
    return colors[rank] || 'text-gray-400';
  };

  const getRankBg = (rank) => {
    const colors = {
      Netherite: 'from-gray-700 to-gray-900',
      Diamond: 'from-cyan-500 to-cyan-700',
      Amethyst: 'from-purple-500 to-purple-700',
      Emerald: 'from-green-500 to-green-700',
      Gold: 'from-yellow-500 to-yellow-700',
      Iron: 'from-gray-400 to-gray-600',
      Copper: 'from-orange-600 to-orange-800'
    };
    return colors[rank] || 'from-gray-500 to-gray-600';
  };

  const getClassColor = (className) => {
    const colors = {
      Tank: 'text-blue-400',
      Brawler: 'text-red-400',
      Sniper: 'text-yellow-400',
      Trickster: 'text-purple-400',
      Support: 'text-green-400'
    };
    return colors[className] || 'text-gray-400';
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

  const winRate = (player.gamesPlayed || 0) > 0 ? Math.round(((player.wins || 0) / player.gamesPlayed) * 100) : 0;
  
  // Get stats for selected class or overall
  const displayStats = selectedClass && player.classStats?.[selectedClass] 
    ? player.classStats[selectedClass]
    : {
        kills: player.totalKills || 0,
        deaths: player.totalDeaths || 0,
        assists: player.totalAssists || 0,
        damage: player.totalDamage || 0,
        healing: player.totalHealing || 0,
        gamesPlayed: player.gamesPlayed || 0,
        wins: player.wins || 0
      };

  const displayKdr = displayStats.deaths > 0 
    ? (displayStats.kills / displayStats.deaths).toFixed(2)
    : displayStats.kills?.toFixed(2) || '0.00';

  const displayWinRate = displayStats.gamesPlayed > 0 
    ? Math.round((displayStats.wins / displayStats.gamesPlayed) * 100) 
    : 0;

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
                    player.username?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                {/* Rank Badge */}
                <div className={`absolute -bottom-2 -right-2 w-14 h-14 rounded-xl bg-gradient-to-br ${getRankBg(player.rank)} flex items-center justify-center overflow-hidden`}>
                  {RANK_ICONS[player.rank] ? (
                    <img 
                      src={RANK_ICONS[player.rank]} 
                      alt={player.rank} 
                      className="w-10 h-10 object-contain"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                    />
                  ) : null}
                  <span className={`font-display text-sm ${RANK_ICONS[player.rank] ? 'hidden' : ''}`}>
                    {player.rank?.substring(0, 3)}
                  </span>
                </div>
              </div>
              
              <div className="text-center md:text-left flex-1">
                <h1 className="font-display text-4xl mb-2">{player.username || 'Unknown'}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400">
                  <span className={`font-display text-2xl ${getRankColor(player.rank)}`}>{player.rank || 'Unranked'}</span>
                  <span>•</span>
                  <span className="font-mono text-xl">{player.elo || 0} ELO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold" style={{ color: '#9ced23' }}>{player.gamesPlayed || 0}</div>
              <div className="text-gray-400 text-sm">Games Played</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400">{player.wins || 0}</div>
              <div className="text-gray-400 text-sm">Wins</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-red-400">{player.losses || 0}</div>
              <div className="text-gray-400 text-sm">Losses</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-400">{winRate}%</div>
              <div className="text-gray-400 text-sm">Win Rate</div>
            </div>
          </div>

          {/* Class Stats */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-xl flex items-center gap-2">
                {selectedClass && <ClassIcon classType={selectedClass} size="w-6 h-6" />}
                {selectedClass ? `${selectedClass.toUpperCase()} STATS` : 'OVERALL STATS'}
              </h2>
              
              {/* Class Selector */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedClass(null)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedClass === null 
                      ? 'bg-[#9ced23] text-black' 
                      : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                  }`}
                >
                  All
                </button>
                {Object.keys(CLASS_ICONS).map((className) => (
                  <button
                    key={className}
                    onClick={() => setSelectedClass(className)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                      selectedClass === className 
                        ? 'bg-[#9ced23] text-black' 
                        : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                    }`}
                  >
                    <ClassIcon classType={className} size="w-5 h-5" />
                    <span className="hidden sm:inline">{className}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-dark-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{displayStats.kills || 0}</div>
                <div className="text-gray-500 text-xs">Kills</div>
              </div>
              <div className="bg-dark-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{displayStats.deaths || 0}</div>
                <div className="text-gray-500 text-xs">Deaths</div>
              </div>
              <div className="bg-dark-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{displayStats.assists || 0}</div>
                <div className="text-gray-500 text-xs">Assists</div>
              </div>
              <div className="bg-dark-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{displayKdr}</div>
                <div className="text-gray-500 text-xs">KDR</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{displayStats.damage || 0}</div>
                <div className="text-gray-500 text-xs">Damage</div>
              </div>
              <div className="bg-dark-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-pink-400">{displayStats.healing || 0}</div>
                <div className="text-gray-500 text-xs">Healing</div>
              </div>
              <div className="bg-dark-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: '#9ced23' }}>{displayStats.gamesPlayed || 0}</div>
                <div className="text-gray-500 text-xs">Games</div>
              </div>
              <div className="bg-dark-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">{displayWinRate}%</div>
                <div className="text-gray-500 text-xs">Win Rate</div>
              </div>
            </div>
          </div>

          {/* Match History */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6">
            <h2 className="font-display text-2xl mb-6">MATCH HISTORY</h2>
            
            {player.recentMatches && player.recentMatches.length > 0 ? (
              <div className="space-y-4">
                {player.recentMatches.map((match, i) => {
                  const isWinner = match.winners?.some(p => p.odiscordId === player.odiscordId);
                  const isDraw = match.isDraw;
                  const playerResult = isWinner 
                    ? match.winners.find(p => p.odiscordId === player.odiscordId)
                    : match.losers?.find(p => p.odiscordId === player.odiscordId);
                  
                  const matchDate = new Date(match.timestamp);
                  
                  return (
                    <Link 
                      key={match.id || i} 
                      href={`/match/${match.id}`}
                      className={`block bg-dark-700 border rounded-xl p-4 hover:bg-dark-600 transition-colors ${
                        isDraw ? 'border-gray-500/30' : isWinner ? 'border-green-500/30' : 'border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                            isDraw ? 'bg-gray-500/20 text-gray-400' :
                            isWinner ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {isDraw ? 'DRAW' : isWinner ? 'WIN' : 'LOSS'}
                          </div>
                          {/* Class played */}
                          {playerResult?.class && (
                            <div className={`flex items-center gap-1 text-sm ${getClassColor(playerResult.class)}`}>
                              <ClassIcon classType={playerResult.class} size="w-4 h-4" />
                              <span>{playerResult.class}</span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-gray-400">
                              {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-500">Lobby: {match.lobbyId}</div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            {playerResult && !isDraw && (
                              <div className={`font-mono text-lg ${playerResult.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {playerResult.change >= 0 ? '+' : ''}{playerResult.change} ELO
                              </div>
                            )}
                            {isDraw && (
                              <div className="font-mono text-lg text-gray-400">±0 ELO</div>
                            )}
                            {playerResult && (
                              <div className="text-xs text-gray-500">
                                {playerResult.oldElo} → {playerResult.newElo}
                              </div>
                            )}
                          </div>
                          <div className="text-gray-500">→</div>
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
                      <div className="mt-3 pt-3 border-t border-dark-600 grid md:grid-cols-2 gap-4" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <div className="text-xs text-green-400 mb-1">Winners</div>
                          <div className="flex flex-wrap gap-1">
                            {match.winners?.map(p => (
                              <span 
                                key={p.odiscordId} 
                                className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                  p.odiscordId === player.odiscordId 
                                    ? 'bg-green-500/30 text-green-300' 
                                    : 'bg-dark-600 text-gray-400'
                                }`}
                              >
                                {p.class && <ClassIcon classType={p.class} size="w-3 h-3" />}
                                {p.username}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-red-400 mb-1">Losers</div>
                          <div className="flex flex-wrap gap-1">
                            {match.losers?.map(p => (
                              <span 
                                key={p.odiscordId} 
                                className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                  p.odiscordId === player.odiscordId 
                                    ? 'bg-red-500/30 text-red-300' 
                                    : 'bg-dark-600 text-gray-400'
                                }`}
                              >
                                {p.class && <ClassIcon classType={p.class} size="w-3 h-3" />}
                                {p.username}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
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
