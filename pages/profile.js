import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

// Class icons
const CLASS_ICONS = {
  Tank: '/classes/tank.png',
  Brawler: '/classes/brawler.png',
  Sniper: '/classes/sniper.png',
  Trickster: '/classes/trickster.png',
  Support: '/classes/support.png'
};

const ClassIcon = ({ classType, size = 'w-6 h-6' }) => {
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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.discordId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/players/${session.user.discordId}`);
        if (res.ok) {
          const data = await res.json();
          setPlayer(data);
        }
      } catch (e) {
        console.error('Failed to fetch profile:', e);
      }
      setLoading(false);
    };

    if (status !== 'loading') {
      fetchProfile();
    }
  }, [session, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="font-display text-2xl mb-4">Login Required</h1>
          <p className="text-gray-400 mb-6">Sign in with Discord to view your profile</p>
          <button onClick={() => signIn('discord')} className="btn-primary">
            Login with Discord
          </button>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="font-display text-2xl mb-4">No Profile Yet</h1>
          <p className="text-gray-400 mb-6">Play your first game to create your profile!</p>
          <Link href="/create" className="btn-primary">
            Play Now
          </Link>
        </div>
      </div>
    );
  }

  const displayWinRate = player.gamesPlayed > 0 
    ? Math.round((player.wins / player.gamesPlayed) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-xl bg-dark-600 flex items-center justify-center overflow-hidden">
                  {player.minecraftUuid ? (
                    <img src={`https://mc-heads.net/avatar/${player.minecraftUuid}/96`} alt="" className="w-full h-full" />
                  ) : player.avatar ? (
                    <img src={player.avatar} alt="" className="w-full h-full" />
                  ) : (
                    <span className="text-3xl">{player.minecraftUsername?.[0]?.toUpperCase() || player.username?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>
                {/* Rank Badge */}
                <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-lg bg-gradient-to-br ${getRankBg(player.rank)} flex items-center justify-center`}>
                  <img 
                    src={`/ranks/${player.rank?.toLowerCase()}.png`}
                    alt={player.rank}
                    className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="font-display text-3xl mb-1">{player.minecraftUsername || player.username}</h1>
                <div className="text-gray-400">{player.rank || 'Unranked'}</div>
                {player.minecraftUsername && player.username && (
                  <div className="text-gray-500 text-sm">Discord: {player.username}</div>
                )}
              </div>

              {/* ELO */}
              <div className="text-center">
                <div className="font-mono text-4xl">{player.elo || 500}</div>
                <div className="text-gray-500 text-sm">ELO</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{player.wins || 0}</div>
              <div className="text-gray-500 text-xs">Wins</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{player.losses || 0}</div>
              <div className="text-gray-500 text-xs">Losses</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{player.gamesPlayed || 0}</div>
              <div className="text-gray-500 text-xs">Games</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{displayWinRate}%</div>
              <div className="text-gray-500 text-xs">Win Rate</div>
            </div>
          </div>

          {/* Combat Stats */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-6">
            <h2 className="font-display text-xl mb-4">COMBAT STATS</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                <div className="text-2xl font-bold text-orange-400">{(player.totalDamage || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs">Damage</div>
              </div>
            </div>
          </div>

          {/* Class Stats */}
          {player.classStats && (
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-6">
              <h2 className="font-display text-xl mb-4">CLASS STATS</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(player.classStats).map(([className, stats]) => (
                  <div key={className} className="bg-dark-700 rounded-xl p-4">
                    <div className={`flex items-center gap-2 mb-3 ${getClassColor(className)}`}>
                      <ClassIcon classType={className} size="w-6 h-6" />
                      <span className="font-semibold">{className}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Games</span>
                        <span>{stats.gamesPlayed || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Wins</span>
                        <span className="text-green-400">{stats.wins || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">K/D/A</span>
                        <span>{stats.kills || 0}/{stats.deaths || 0}/{stats.assists || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match History */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6">
            <h2 className="font-display text-xl mb-4">MATCH HISTORY</h2>
            
            {player.recentMatches && player.recentMatches.length > 0 ? (
              <div className="space-y-3">
                {player.recentMatches.map((match, i) => {
                  const isWinner = match.winners?.some(p => p.odiscordId === player.odiscordId);
                  const isDraw = match.isDraw;
                  const playerResult = isWinner 
                    ? match.winners?.find(p => p.odiscordId === player.odiscordId)
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
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          {playerResult && !isDraw && (
                            <div className={`font-mono text-lg ${playerResult.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {playerResult.change >= 0 ? '+' : ''}{playerResult.change} ELO
                            </div>
                          )}
                          {isDraw && (
                            <div className="font-mono text-lg text-gray-400">±0 ELO</div>
                          )}
                          <div className="text-gray-500 text-sm">→</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No matches played yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
