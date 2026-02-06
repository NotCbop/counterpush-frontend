import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/leaderboard`);
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

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl text-center mb-8">LEADERBOARD</h1>

          {players.length > 0 ? (
            <div className="space-y-3">
              {players.map((player, index) => (
                <Link 
                  key={player.odiscordId} 
                  href={`/player/${player.odiscordId}`}
                  className="block bg-dark-800 border border-dark-600 rounded-xl p-4 card-hover"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Position */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-dark-700 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center">
                        {player.avatar ? (
                          <img src={player.avatar} alt="" className="w-full h-full rounded-full" />
                        ) : (
                          <span className="text-lg">{player.username[0].toUpperCase()}</span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="font-semibold">{player.username}</div>
                      <div className="text-sm text-gray-400">
                        {player.wins}W - {player.losses}L
                      </div>
                    </div>

                    {/* Rank Badge */}
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRankBg(player.rank)} flex items-center justify-center font-display`}>
                      {player.rank}
                    </div>

                    {/* ELO */}
                    <div className="text-right">
                      <div className="font-mono text-xl">{player.elo}</div>
                      <div className="text-xs text-gray-500">ELO</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div className="text-6xl mb-4">🏆</div>
              <p>No ranked players yet. Play some games!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
