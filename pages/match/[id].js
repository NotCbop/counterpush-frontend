import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

// Team color definitions
const TEAM_COLORS = {
  0: { name: 'White', hex: '#ffffff', text: 'text-gray-200', border: 'border-gray-300', bg: 'bg-gray-500' },
  1: { name: 'Blue', hex: '#3b82f6', text: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-500' },
  2: { name: 'Purple', hex: '#a855f7', text: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-500' },
  3: { name: 'Green', hex: '#22c55e', text: 'text-green-400', border: 'border-green-500', bg: 'bg-green-500' },
  4: { name: 'Yellow', hex: '#eab308', text: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-500' },
  5: { name: 'Red', hex: '#ef4444', text: 'text-red-400', border: 'border-red-500', bg: 'bg-red-500' },
  6: { name: 'Pink', hex: '#ec4899', text: 'text-pink-400', border: 'border-pink-500', bg: 'bg-pink-500' },
  7: { name: 'Orange', hex: '#f97316', text: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-500' }
};

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

export default function MatchDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchMatch = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/matches/${id}`);
        if (res.ok) {
          const data = await res.json();
          setMatch(data);
        }
      } catch (e) {
        console.error('Failed to fetch match:', e);
      }
      setLoading(false);
    };

    fetchMatch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="font-display text-2xl mb-4">Match Not Found</h1>
          <Link href="/matches" className="btn-primary">View All Matches</Link>
        </div>
      </div>
    );
  }

  const team1Color = TEAM_COLORS[match.team1Color || 1];
  const team2Color = TEAM_COLORS[match.team2Color || 5];
  const matchDate = new Date(match.timestamp);

  // Determine which team won
  const team1Won = match.winners?.some(p => match.winners?.find(w => w.odiscordId === p.odiscordId));
  
  // Separate players by team
  const team1Players = [...(match.winners || []), ...(match.losers || [])].filter(p => {
    // Check if player is in winners and team1 won, or in losers and team1 lost
    const isWinner = match.winners?.some(w => w.odiscordId === p.odiscordId);
    return (isWinner && match.eloGain > 0) || (!isWinner && match.eloGain <= 0);
  });

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Match Header */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl mb-2">MATCH #{match.id?.slice(-6) || id}</h1>
                <div className="text-gray-400">
                  {matchDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {match.lobbyId && (
                  <div className="text-sm text-gray-500 mt-1">Lobby: {match.lobbyId}</div>
                )}
                {!match.isRanked && match.isRanked !== undefined && (
                  <div className="text-sm text-gray-500 mt-1">🎮 Casual Match (No ELO)</div>
                )}
              </div>
              
              {match.isDraw ? (
                <div className="text-4xl font-display text-gray-400">DRAW</div>
              ) : (
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">ELO Change</div>
                  <div className="text-3xl font-mono text-green-400">+{match.eloGain || 0}</div>
                </div>
              )}
            </div>
          </div>

          {/* Teams */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Winners */}
            <div className={`bg-dark-800 border ${team1Color.border}/30 rounded-2xl p-6`}>
              <h3 className={`font-display text-xl ${team1Color.text} mb-4 flex items-center gap-2`}>
                <span className={`w-4 h-4 rounded ${team1Color.bg}`}></span>
                🏆 WINNERS
                {match.isRanked !== false && <span className="text-sm font-normal text-green-300">+{match.eloGain || 0} ELO</span>}
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
                      {match.isRanked !== false && (
                        <div className="text-green-400 font-mono text-sm">
                          {player.oldElo} → {player.newElo}
                        </div>
                      )}
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
                          <div className="text-yellow-400 font-bold">
                            {player.stats.deaths > 0 ? (player.stats.kills / player.stats.deaths).toFixed(2) : player.stats.kills}
                          </div>
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

            {/* Losers */}
            <div className={`bg-dark-800 border ${team2Color.border}/30 rounded-2xl p-6`}>
              <h3 className={`font-display text-xl ${team2Color.text} mb-4 flex items-center gap-2`}>
                <span className={`w-4 h-4 rounded ${team2Color.bg}`}></span>
                LOSERS
                {match.isRanked !== false && <span className="text-sm font-normal text-red-300">-{match.eloLoss || 0} ELO</span>}
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
                      {match.isRanked !== false && (
                        <div className="text-red-400 font-mono text-sm">
                          {player.oldElo} → {player.newElo}
                        </div>
                      )}
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
                          <div className="text-yellow-400 font-bold">
                            {player.stats.deaths > 0 ? (player.stats.kills / player.stats.deaths).toFixed(2) : player.stats.kills}
                          </div>
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

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link href="/matches" className="text-gray-400 hover:text-white transition-colors">
              ← Back to Matches
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
