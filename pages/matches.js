import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/matches`);
        const data = await res.json();
        setMatches(data);
      } catch (e) {
        console.error('Error fetching matches:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

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
          <h1 className="font-display text-4xl text-center mb-8">MATCH HISTORY</h1>

          {matches.length === 0 ? (
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🎮</div>
              <p className="text-gray-400">No matches played yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match, i) => {
                const matchDate = new Date(match.timestamp);
                const winnerNames = match.winners?.map(p => p.username).join(', ') || 'Unknown';
                const loserNames = match.losers?.map(p => p.username).join(', ') || 'Unknown';

                return (
                  <Link 
                    key={match.id || i}
                    href={`/match/${match.id}`}
                    className="block bg-dark-800 border border-dark-600 rounded-xl p-6 hover:border-[#9ced23]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                          match.isDraw ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {match.isDraw ? 'DRAW' : 'MATCH'}
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">
                            {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-500">Lobby: {match.lobbyId}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {!match.isDraw && (
                          <div className="text-gray-400">
                            <span className="text-green-400">+{match.eloGain}</span> / <span className="text-red-400">-{match.eloLoss}</span> ELO
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-dark-700 rounded-lg p-3">
                        <div className="text-xs text-green-400 mb-1">🏆 Winners</div>
                        <div className="text-sm truncate">{winnerNames}</div>
                      </div>
                      <div className="bg-dark-700 rounded-lg p-3">
                        <div className="text-xs text-red-400 mb-1">💀 Losers</div>
                        <div className="text-sm truncate">{loserNames}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-center text-xs text-gray-500 hover:text-[#9ced23] transition-colors">
                      Click to view match details →
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
