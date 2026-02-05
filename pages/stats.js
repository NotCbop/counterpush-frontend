import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';

export default function Stats() {
  const { data: session } = useSession();
  const router = useRouter();
  const { user: queryUser } = router.query;
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const userId = queryUser || session?.user?.discordId;
      
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/players/${userId}`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
      setLoading(false);
    };

    fetchStats();
  }, [session, queryUser]);

  const getRankColor = (rank) => {
    const colors = {
      S: 'rank-s',
      A: 'rank-a',
      B: 'rank-b',
      C: 'rank-c',
      D: 'rank-d',
      F: 'rank-f',
    };
    return colors[rank] || 'text-gray-400';
  };

  const getRankGlow = (rank) => {
    const glows = {
      S: 'shadow-yellow-500/30',
      A: 'shadow-purple-500/30',
      B: 'shadow-blue-500/30',
      C: 'shadow-emerald-500/30',
      D: 'shadow-orange-500/30',
      F: 'shadow-gray-500/30',
    };
    return glows[rank] || '';
  };

  const getRankGradient = (rank) => {
    const gradients = {
      S: 'from-yellow-500 to-amber-600',
      A: 'from-purple-500 to-violet-600',
      B: 'from-blue-500 to-indigo-600',
      C: 'from-emerald-500 to-green-600',
      D: 'from-orange-500 to-red-600',
      F: 'from-gray-500 to-gray-600',
    };
    return gradients[rank] || 'from-gray-500 to-gray-600';
  };

  const getNextRank = (rank, elo) => {
    const thresholds = { F: 800, D: 950, C: 1100, B: 1250, A: 1400 };
    const order = ['F', 'D', 'C', 'B', 'A', 'S'];
    const idx = order.indexOf(rank);
    
    if (idx < order.length - 1) {
      const nextRank = order[idx + 1];
      const nextElo = thresholds[nextRank];
      return { rank: nextRank, elo: nextElo, needed: nextElo - elo };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!stats && !session) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">📊</div>
            <h1 className="font-display text-2xl mb-4">LOGIN TO VIEW STATS</h1>
            <p className="text-gray-400">Connect your Discord account to see your stats.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="font-display text-2xl mb-4">PLAYER NOT FOUND</h1>
            <p className="text-gray-400">This player hasn't played any games yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const winRate = stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : '0.0';
  const nextRank = getNextRank(stats.rank, stats.elo);

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Player Card */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar & Rank */}
              <div className="relative">
                <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${getRankGradient(stats.rank)} p-1 shadow-lg ${getRankGlow(stats.rank)}`}>
                  <div className="w-full h-full rounded-xl bg-dark-800 flex items-center justify-center text-5xl">
                    {stats.avatar ? (
                      <img src={stats.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      stats.username ? stats.username[0].toUpperCase() : '?'
                    )}
                  </div>
                </div>
                <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-lg bg-gradient-to-br ${getRankGradient(stats.rank)} flex items-center justify-center font-display text-xl shadow-lg`}>
                  {stats.rank}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-display text-4xl mb-2">{stats.username || 'Unknown Player'}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-400">
                  <span className={`font-semibold ${getRankColor(stats.rank)}`}>{stats.rank} Rank</span>
                  <span>•</span>
                  <span className="font-mono">{stats.elo} ELO</span>
                  <span>•</span>
                  <span>{stats.gamesPlayed} games</span>
                </div>

                {/* Progress to next rank */}
                {nextRank && (
                  <div className="mt-4 max-w-md">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Progress to {nextRank.rank}</span>
                      <span>{nextRank.needed} ELO needed</span>
                    </div>
                    <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getRankGradient(nextRank.rank)} transition-all duration-500`}
                        style={{ width: `${Math.max(0, Math.min(100, ((150 - nextRank.needed) / 150) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-500">{stats.wins}</div>
              <div className="text-gray-400 text-sm mt-1">Wins</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-red-500">{stats.losses}</div>
              <div className="text-gray-400 text-sm mt-1">Losses</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold" style={{ color: '#9ced23' }}>{winRate}%</div>
              <div className="text-gray-400 text-sm mt-1">Win Rate</div>
            </div>
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.gamesPlayed}</div>
              <div className="text-gray-400 text-sm mt-1">Games Played</div>
            </div>
          </div>

          {/* Rank Info */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6">
            <h2 className="font-display text-xl mb-4">RANK TIERS</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { rank: 'S', elo: '1400+' },
                { rank: 'A', elo: '1250+' },
                { rank: 'B', elo: '1100+' },
                { rank: 'C', elo: '950+' },
                { rank: 'D', elo: '800+' },
                { rank: 'F', elo: '<800' },
              ].map((tier) => (
                <div
                  key={tier.rank}
                  className={`p-3 rounded-lg text-center ${stats.rank === tier.rank ? `bg-gradient-to-br ${getRankGradient(tier.rank)}` : 'bg-dark-700'}`}
                >
                  <div className={`font-display text-xl ${stats.rank === tier.rank ? 'text-white' : getRankColor(tier.rank)}`}>
                    {tier.rank}
                  </div>
                  <div className="text-xs text-gray-400">{tier.elo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
