import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';

export default function Leaderboard() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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

  // Search players as user types
  useEffect(() => {
    const searchPlayers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setSearching(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/players/search/${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
        setShowDropdown(true);
      } catch (e) {
        console.error('Search failed:', e);
      }
      setSearching(false);
    };

    const debounce = setTimeout(searchPlayers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectPlayer = (player) => {
    router.push(`/player/${player.odiscordId}`);
    setShowDropdown(false);
    setSearchQuery('');
  };

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

          {/* Player Search */}
          <div className="relative mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a player..."
                className="w-full px-4 py-3 pl-12 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-[#9ced23] transition-colors"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-600 rounded-xl shadow-xl overflow-hidden">
                {searchResults.map((player) => (
                  <button
                    key={player.odiscordId}
                    onClick={() => handleSelectPlayer(player)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-dark-700 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center overflow-hidden">
                      {player.avatar ? (
                        <img src={player.avatar} alt="" className="w-full h-full" />
                      ) : (
                        <span>{player.username[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{player.username}</div>
                      <div className="text-sm text-gray-400">ELO: {player.elo}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRankBg(player.rank)} flex items-center justify-center overflow-hidden`}>
                      <img 
                        src={`/ranks/${player.rank?.toLowerCase()}.png`}
                        alt={player.rank}
                        className="w-8 h-8 object-contain"
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <div className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-600 rounded-xl shadow-xl p-4 text-center text-gray-500">
                No players found
              </div>
            )}
          </div>

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
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRankBg(player.rank)} flex items-center justify-center overflow-hidden`}>
                      <img 
                        src={`/ranks/${player.rank?.toLowerCase()}.png`}
                        alt={player.rank}
                        className="w-8 h-8 object-contain"
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                        }}
                      />
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
