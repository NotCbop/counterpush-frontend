import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

const PLAYERS_PER_PAGE = 50;

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

export default function StatsLeaderboardPage() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('kills');
  const [selectedClass, setSelectedClass] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const sortOptions = [
    { key: 'kills', label: 'Kills', color: 'text-green-400' },
    { key: 'deaths', label: 'Deaths', color: 'text-red-400' },
    { key: 'assists', label: 'Assists', color: 'text-blue-400' },
    { key: 'kdr', label: 'KDR', color: 'text-yellow-400' },
    { key: 'damage', label: 'Damage', color: 'text-orange-400' },
    { key: 'healing', label: 'Healing', color: 'text-pink-400' },
    { key: 'gamesPlayed', label: 'Games', color: 'text-purple-400' },
  ];

  const classes = ['Tank', 'Brawler', 'Sniper', 'Trickster', 'Support'];

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/players`);
        const data = await res.json();
        setAllPlayers(data);
      } catch (e) {
        console.error('Error fetching players:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Reset to page 1 when sort or class filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, selectedClass]);

  const getPlayerStats = (player) => {
    if (selectedClass && player.classStats?.[selectedClass]) {
      const cs = player.classStats[selectedClass];
      return {
        kills: cs.kills || 0,
        deaths: cs.deaths || 0,
        assists: cs.assists || 0,
        damage: cs.damage || 0,
        healing: cs.healing || 0,
        gamesPlayed: cs.gamesPlayed || 0,
        kdr: cs.deaths > 0 ? (cs.kills / cs.deaths) : cs.kills || 0
      };
    }
    return {
      kills: player.totalKills || 0,
      deaths: player.totalDeaths || 0,
      assists: player.totalAssists || 0,
      damage: player.totalDamage || 0,
      healing: player.totalHealing || 0,
      gamesPlayed: player.gamesPlayed || 0,
      kdr: player.totalDeaths > 0 ? (player.totalKills / player.totalDeaths) : player.totalKills || 0
    };
  };

  const sortedPlayers = [...allPlayers]
    .map(p => ({ ...p, stats: getPlayerStats(p) }))
    .filter(p => p.stats.gamesPlayed > 0 || p.stats.kills > 0)
    .sort((a, b) => {
      const aVal = a.stats[sortBy] || 0;
      const bVal = b.stats[sortBy] || 0;
      return bVal - aVal;
    });

  // Pagination
  const totalPages = Math.ceil(sortedPlayers.length / PLAYERS_PER_PAGE);
  const startIndex = (currentPage - 1) * PLAYERS_PER_PAGE;
  const players = sortedPlayers.slice(startIndex, startIndex + PLAYERS_PER_PAGE);

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
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-4xl text-center mb-8">STATS LEADERBOARD</h1>

          {/* Class Filter */}
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-gray-400 text-sm mr-2">Filter by Class:</span>
              <button
                onClick={() => setSelectedClass(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedClass === null 
                    ? 'bg-[#9ced23] text-black' 
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
              >
                All Classes
              </button>
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedClass === cls 
                      ? 'bg-[#9ced23] text-black' 
                      : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                  }`}
                >
                  <ClassIcon classType={cls} size="w-4 h-4" />
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-gray-400 text-sm mr-2">Sort by:</span>
              {sortOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === option.key 
                      ? 'bg-[#9ced23] text-black' 
                      : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Page Info */}
          {totalPages > 1 && (
            <div className="text-center text-gray-400 text-sm mb-4">
              Showing {startIndex + 1}-{Math.min(startIndex + PLAYERS_PER_PAGE, sortedPlayers.length)} of {sortedPlayers.length} players
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="px-4 py-3 text-left text-gray-400 text-sm">#</th>
                  <th className="px-4 py-3 text-left text-gray-400 text-sm">Player</th>
                  <th className="px-4 py-3 text-center text-green-400 text-sm">Kills</th>
                  <th className="px-4 py-3 text-center text-red-400 text-sm">Deaths</th>
                  <th className="px-4 py-3 text-center text-blue-400 text-sm">Assists</th>
                  <th className="px-4 py-3 text-center text-yellow-400 text-sm">KDR</th>
                  <th className="px-4 py-3 text-center text-orange-400 text-sm">Damage</th>
                  <th className="px-4 py-3 text-center text-pink-400 text-sm">Healing</th>
                  <th className="px-4 py-3 text-center text-purple-400 text-sm">Games</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => {
                  const globalIndex = startIndex + index;
                  return (
                    <tr 
                      key={player.odiscordId} 
                      className="border-b border-dark-700 hover:bg-dark-700 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          globalIndex === 0 ? 'bg-yellow-500 text-black' :
                          globalIndex === 1 ? 'bg-gray-400 text-black' :
                          globalIndex === 2 ? 'bg-orange-600 text-white' :
                          'bg-dark-600 text-gray-400'
                        }`}>
                          {globalIndex + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/player/${player.odiscordId}`} className="flex items-center gap-3 hover:text-[#9ced23] transition-colors">
                          <div className="w-8 h-8 rounded bg-dark-600 flex items-center justify-center overflow-hidden">
                            {player.minecraftUuid ? (
                              <img src={`https://mc-heads.net/avatar/${player.minecraftUuid}/32`} alt="" className="w-full h-full" />
                            ) : player.avatar ? (
                              <img src={player.avatar} alt="" className="w-full h-full" />
                            ) : (
                              <span className="text-xs">{player.minecraftUsername?.[0]?.toUpperCase() || player.username?.[0]?.toUpperCase() || '?'}</span>
                            )}
                          </div>
                          <span className="font-medium">{player.minecraftUsername || player.username || 'Unknown'}</span>
                        </Link>
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${sortBy === 'kills' ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                        {player.stats.kills}
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${sortBy === 'deaths' ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                        {player.stats.deaths}
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${sortBy === 'assists' ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>
                        {player.stats.assists}
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${sortBy === 'kdr' ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                        {player.stats.kdr.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${sortBy === 'damage' ? 'text-orange-400 font-bold' : 'text-gray-300'}`}>
                        {player.stats.damage.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${sortBy === 'healing' ? 'text-pink-400 font-bold' : 'text-gray-300'}`}>
                        {player.stats.healing.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${sortBy === 'gamesPlayed' ? 'text-purple-400 font-bold' : 'text-gray-300'}`}>
                        {player.stats.gamesPlayed}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {players.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No players with stats yet
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-dark-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600 transition-colors"
              >
                ← Prev
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page 
                        ? 'bg-[#9ced23] text-black' 
                        : 'bg-dark-700 hover:bg-dark-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-dark-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
