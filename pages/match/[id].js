import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

// Class icons
const CLASS_ICONS = {
  Tank: '/classes/tank.png',
  Brawler: '/classes/brawler.png',
  Sniper: '/classes/sniper.png',
  Trickster: '/classes/trickster.png',
  Support: '/classes/support.png'
};

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

export default function MatchDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchMatch = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/match/${id}`);
        if (!res.ok) throw new Error('Match not found');
        const data = await res.json();
        setMatch(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id]);

  const calculateKDR = (kills, deaths) => {
    if (!deaths || deaths === 0) return (kills || 0).toFixed(2);
    return (kills / deaths).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="font-display text-2xl mb-4">Match Not Found</h1>
          <Link href="/matches" className="btn-primary">Back to Matches</Link>
        </div>
      </div>
    );
  }

  const matchDate = new Date(match.timestamp);

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Match Header */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 mb-8">
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">
                {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-gray-500 text-xs mb-4">Match ID: {match.id} • Lobby: {match.lobbyId}</div>
              
              {match.isDraw ? (
                <div className="font-display text-4xl text-gray-400 mb-4">🤝 DRAW 🤝</div>
              ) : (
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="font-display text-2xl text-blue-400">TEAM 1</div>
                    <div className="text-4xl font-bold text-blue-400">{match.winners?.[0]?.odiscordId === match.winners?.[0]?.odiscordId ? '🏆' : ''}</div>
                  </div>
                  <div className="text-4xl font-display text-gray-500">VS</div>
                  <div className="text-center">
                    <div className="font-display text-2xl text-red-400">TEAM 2</div>
                  </div>
                </div>
              )}

              {/* ELO Info */}
              {!match.isDraw && (
                <div className="mt-4 flex justify-center gap-8 text-sm">
                  <div className="text-gray-400">
                    Avg ELO: <span className="text-blue-400">{match.winnerAvgElo || '?'}</span>
                  </div>
                  <div className="text-gray-400">
                    Avg ELO: <span className="text-red-400">{match.loserAvgElo || '?'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Teams */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Winners / Team 1 */}
            <div className="bg-dark-800 border border-green-500/30 rounded-2xl p-6">
              <h3 className="font-display text-xl text-green-400 mb-4 flex items-center gap-2">
                🏆 {match.isDraw ? 'TEAM 1' : 'WINNERS'}
                {!match.isDraw && <span className="text-sm font-normal text-green-300">+{match.eloGain} ELO</span>}
              </h3>
              
              <div className="space-y-4">
                {match.winners?.map((player, i) => (
                  <Link 
                    key={player.odiscordId || i}
                    href={`/player/${player.odiscordId}`}
                    className="block bg-dark-700 rounded-xl p-4 hover:bg-dark-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold">{player.username}</div>
                        {player.class && (
                          <div className={`flex items-center gap-1 text-sm ${getClassColor(player.class)}`}>
                            <ClassIcon classType={player.class} size="w-4 h-4" />
                            <span>{player.class}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-green-400 font-mono text-sm">
                        {player.oldElo} → {player.newElo}
                      </div>
                    </div>
                    
                    {player.stats && (
                      <div className="grid grid-cols-5 gap-2 text-center text-sm">
                        <div>
                          <div className="text-green-400 font-bold">{player.stats.kills || 0}</div>
                          <div className="text-gray-500 text-xs">Kills</div>
                        </div>
                        <div>
                          <div className="text-red-400 font-bold">{player.stats.deaths || 0}</div>
                          <div className="text-gray-500 text-xs">Deaths</div>
                        </div>
                        <div>
                          <div className="text-blue-400 font-bold">{player.stats.assists || 0}</div>
                          <div className="text-gray-500 text-xs">Assists</div>
                        </div>
                        <div>
                          <div className="text-yellow-400 font-bold">{calculateKDR(player.stats.kills, player.stats.deaths)}</div>
                          <div className="text-gray-500 text-xs">KDR</div>
                        </div>
                        <div>
                          <div className="text-orange-400 font-bold">{player.stats.damage || 0}</div>
                          <div className="text-gray-500 text-xs">DMG</div>
                        </div>
                      </div>
                    )}
                    
                    {!player.stats && (
                      <div className="text-gray-500 text-sm text-center">No stats recorded</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Losers / Team 2 */}
            <div className="bg-dark-800 border border-red-500/30 rounded-2xl p-6">
              <h3 className="font-display text-xl text-red-400 mb-4 flex items-center gap-2">
                {match.isDraw ? 'TEAM 2' : '💀 LOSERS'}
                {!match.isDraw && <span className="text-sm font-normal text-red-300">-{match.eloLoss} ELO</span>}
              </h3>
              
              <div className="space-y-4">
                {match.losers?.map((player, i) => (
                  <Link 
                    key={player.odiscordId || i}
                    href={`/player/${player.odiscordId}`}
                    className="block bg-dark-700 rounded-xl p-4 hover:bg-dark-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold">{player.username}</div>
                        {player.class && (
                          <div className={`flex items-center gap-1 text-sm ${getClassColor(player.class)}`}>
                            <ClassIcon classType={player.class} size="w-4 h-4" />
                            <span>{player.class}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-red-400 font-mono text-sm">
                        {player.oldElo} → {player.newElo}
                      </div>
                    </div>
                    
                    {player.stats && (
                      <div className="grid grid-cols-5 gap-2 text-center text-sm">
                        <div>
                          <div className="text-green-400 font-bold">{player.stats.kills || 0}</div>
                          <div className="text-gray-500 text-xs">Kills</div>
                        </div>
                        <div>
                          <div className="text-red-400 font-bold">{player.stats.deaths || 0}</div>
                          <div className="text-gray-500 text-xs">Deaths</div>
                        </div>
                        <div>
                          <div className="text-blue-400 font-bold">{player.stats.assists || 0}</div>
                          <div className="text-gray-500 text-xs">Assists</div>
                        </div>
                        <div>
                          <div className="text-yellow-400 font-bold">{calculateKDR(player.stats.kills, player.stats.deaths)}</div>
                          <div className="text-gray-500 text-xs">KDR</div>
                        </div>
                        <div>
                          <div className="text-orange-400 font-bold">{player.stats.damage || 0}</div>
                          <div className="text-gray-500 text-xs">DMG</div>
                        </div>
                      </div>
                    )}
                    
                    {!player.stats && (
                      <div className="text-gray-500 text-sm text-center">No stats recorded</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link href="/matches" className="btn-secondary">
              ← Back to All Matches
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
