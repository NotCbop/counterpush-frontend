import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/leaderboard?limit=50`);
        const data = await res.json();
        setPlayers(data);
      } catch (e) {
        console.error('Failed to fetch leaderboard:', e);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

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

  const getRankBg = (rank) => {
    const colors = {
      S: 'from-yellow-500/10 to-amber-600/10',
      A: 'from-purple-500/10 to-violet-600/10',
      B: 'from-blue-500/10 to-indigo-600/10',
      C: 'from-emerald-500/10 to-green-600/10',
      D: 'from-orange-500/10 to-red-600/10',
      F: 'from-gray-500/10 to-gray-600/10',
    };
    return colors[rank] || '';
  };

  const getMedal = (position) => {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return `#${position + 1}`;
  };

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl mb-4">
              <span className="gradient-text">LEADERBOARD</span>
            </h1>
            <p className="text-gray-400">Top players ranked by ELO</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
              <p className="text-gray-400">Loading leaderboard...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="font-display text-2xl mb-2">NO PLAYERS YET</h2>
              <p className="text-gray-400">Play some games to appear on the leaderboard!</p>
            </div>
          ) : (
            <>
              {/* Top 3 Showcase */}
              {players.length >= 3 && (
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {players.slice(0, 3).map((player, i) => (
                    <div
                      key={player.odiscordId}
                      className={`
                        bg-gradient-to-br ${getRankBg(player.rank)} 
                        border border-dark-600 rounded-2xl p-6 text-center
                        ${i === 0 ? 'md:-mt-4 md:scale-105' : ''}
                        card-hover
                      `}
                    >
                      <div className="text-4xl mb-4">{getMedal(i)}</div>
                      <div className="w-20 h-20 mx-auto rounded-full bg-dark-600 flex items-center justify-center text-3xl mb-4">
                        {player.avatar ? (
                          <img src={player.avatar} alt="" className="w-full h-full rounded-full" />
                        ) : (
                          player.username[0].toUpperCase()
                        )}
                      </div>
                      <div className="font-semibold text-lg mb-1">{player.username}</div>
                      <div className={`font-display text-2xl ${getRankColor(player.rank)} mb-2`}>
                        {player.rank} RANK
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">{player.elo} ELO</div>
                      <div className="text-sm text-gray-400">
                        {player.wins}W - {player.losses}L ({player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100).toFixed(0) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Full Leaderboard */}
              <div className="bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-dark-700 text-sm text-gray-400 font-semibold">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Player</div>
                  <div className="col-span-2 text-center">Rank</div>
                  <div className="col-span-2 text-center">ELO</div>
                  <div className="col-span-2 text-center">W/L</div>
                </div>

                {players.map((player, i) => (
                  <div
                    key={player.odiscordId}
                    className={`
                      grid grid-cols-12 gap-4 px-6 py-4 items-center
                      border-t border-dark-600 hover:bg-dark-700/50 transition-colors
                      ${i < 3 ? `bg-gradient-to-r ${getRankBg(player.rank)}` : ''}
                    `}
                  >
                    <div className="col-span-1 font-mono text-gray-400">
                      {i < 3 ? (
                        <span className="text-xl">{getMedal(i)}</span>
                      ) : (
                        <span>#{i + 1}</span>
                      )}
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center">
                        {player.avatar ? (
                          <img src={player.avatar} alt="" className="w-full h-full rounded-full" />
                        ) : (
                          player.username[0].toUpperCase()
                        )}
                      </div>
                      <span className="font-medium">{player.username}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`font-display text-lg ${getRankColor(player.rank)}`}>
                        {player.rank}
                      </span>
                    </div>
                    <div className="col-span-2 text-center font-mono font-bold">
                      {player.elo}
                    </div>
                    <div className="col-span-2 text-center text-sm text-gray-400">
                      {player.wins}W - {player.losses}L
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
