import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '../components/Navbar';

const ADMIN_PASSCODE = 'counterpush-admin-2024';

export default function AdminPage() {
  const { data: session } = useSession();
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  // Player editing
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = () => {
    if (passcode === ADMIN_PASSCODE) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Invalid passcode');
    }
  };

  const searchPlayers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/players/search/${searchQuery}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error('Search error:', e);
    }
  };

  const selectPlayer = (player) => {
    setSelectedPlayer(player);
    setEditData({
      elo: player.elo || 500,
      wins: player.wins || 0,
      losses: player.losses || 0,
      gamesPlayed: player.gamesPlayed || 0,
      totalKills: player.totalKills || 0,
      totalDeaths: player.totalDeaths || 0,
      totalAssists: player.totalAssists || 0,
      totalDamage: player.totalDamage || 0,
      totalHealing: player.totalHealing || 0
    });
    setMessage('');
  };

  const saveChanges = async () => {
    if (!selectedPlayer) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/update-player?key=${ADMIN_PASSCODE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odiscordId: selectedPlayer.odiscordId,
          data: editData
        })
      });

      if (res.ok) {
        setMessage('✅ Player updated successfully!');
        setSelectedPlayer({ ...selectedPlayer, ...editData });
      } else {
        const err = await res.json();
        setMessage(`❌ Error: ${err.error}`);
      }
    } catch (e) {
      setMessage(`❌ Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetAllStats = async () => {
    if (!confirm('Are you sure you want to reset ALL players to 500 ELO and clear all stats? This cannot be undone!')) {
      return;
    }
    if (!confirm('FINAL WARNING: This will DELETE all match history and reset everyone. Type "RESET" in the next prompt to confirm.')) {
      return;
    }
    const confirmation = prompt('Type RESET to confirm:');
    if (confirmation !== 'RESET') {
      setMessage('Reset cancelled');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/reset?key=${ADMIN_PASSCODE}&confirm=yes`);
      const data = await res.json();
      setMessage(`✅ ${data.message}`);
    } catch (e) {
      setMessage(`❌ Error: ${e.message}`);
    }
  };

  const closeAllLobbies = async () => {
    if (!confirm('Close all active lobbies?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/close-lobbies?key=${ADMIN_PASSCODE}`);
      const data = await res.json();
      setMessage(`✅ ${data.message}`);
    } catch (e) {
      setMessage(`❌ Error: ${e.message}`);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8">
              <h1 className="font-display text-2xl text-center mb-6">🔐 ADMIN ACCESS</h1>
              
              <div className="space-y-4">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter admin passcode"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl focus:outline-none focus:border-[#9ced23]"
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button 
                  onClick={handleLogin}
                  className="w-full btn-primary"
                >
                  Access Admin Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl text-center mb-8">🔧 ADMIN PANEL</h1>

          {message && (
            <div className={`mb-6 p-4 rounded-xl text-center ${message.startsWith('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {message}
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-8">
            <h2 className="font-display text-xl mb-4">⚡ Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button onClick={closeAllLobbies} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors">
                Close All Lobbies
              </button>
              <button onClick={resetAllStats} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors">
                ⚠️ Reset All Stats
              </button>
              <a 
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/backup?key=${ADMIN_PASSCODE}`}
                target="_blank"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                📥 Download Backup
              </a>
            </div>
          </div>

          {/* Player Editor */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6">
            <h2 className="font-display text-xl mb-4">👤 Edit Player</h2>

            {/* Search */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPlayers()}
                placeholder="Search player by username..."
                className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl focus:outline-none focus:border-[#9ced23]"
              />
              <button onClick={searchPlayers} className="btn-primary px-6">
                Search
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedPlayer && (
              <div className="mb-4 space-y-2">
                {searchResults.map((player) => (
                  <button
                    key={player.odiscordId}
                    onClick={() => selectPlayer(player)}
                    className="w-full flex items-center gap-3 p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center overflow-hidden">
                      {player.avatar ? (
                        <img src={player.avatar} alt="" className="w-full h-full" />
                      ) : (
                        <span>{player.username?.[0]?.toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{player.username}</div>
                      <div className="text-xs text-gray-500">{player.elo} ELO • {player.gamesPlayed} games</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Edit Form */}
            {selectedPlayer && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-dark-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center overflow-hidden">
                      {selectedPlayer.avatar ? (
                        <img src={selectedPlayer.avatar} alt="" className="w-full h-full" />
                      ) : (
                        <span className="text-xl">{selectedPlayer.username?.[0]?.toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-display text-lg">{selectedPlayer.username}</div>
                      <div className="text-xs text-gray-500">ID: {selectedPlayer.odiscordId}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedPlayer(null); setSearchResults([]); }}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">ELO</label>
                    <input
                      type="number"
                      value={editData.elo}
                      onChange={(e) => setEditData({ ...editData, elo: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg focus:outline-none focus:border-[#9ced23]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Wins</label>
                    <input
                      type="number"
                      value={editData.wins}
                      onChange={(e) => setEditData({ ...editData, wins: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg focus:outline-none focus:border-[#9ced23]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Losses</label>
                    <input
                      type="number"
                      value={editData.losses}
                      onChange={(e) => setEditData({ ...editData, losses: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg focus:outline-none focus:border-[#9ced23]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Games Played</label>
                    <input
                      type="number"
                      value={editData.gamesPlayed}
                      onChange={(e) => setEditData({ ...editData, gamesPlayed: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg focus:outline-none focus:border-[#9ced23]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Total Kills</label>
                    <input
                      type="number"
                      value={editData.totalKills}
                      onChange={(e) => setEditData({ ...editData, totalKills: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg focus:outline-none focus:border-[#9ced23]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Total Deaths</label>
                    <input
                      type="number"
                      value={editData.totalDeaths}
                      onChange={(e) => setEditData({ ...editData, totalDeaths: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg focus:outline-none focus:border-[#9ced23]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Total Assists</label>
                    <input
                      type="number"
                      value={editData.totalAssists}
                      onChange={(e) => setEditData({ ...editData, totalAssists: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg focus:outline-none focus:border-[#9ced23]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Total Damage</label>
                    <input
                      type="number"
                      value={editData.totalDamage}
                      onChange={(e) => setEditData({ ...editData, totalDamage: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg focus:outline-none focus:border-[#9ced23]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Total Healing</label>
                    <input
                      type="number"
                      value={editData.totalHealing}
                      onChange={(e) => setEditData({ ...editData, totalHealing: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg focus:outline-none focus:border-[#9ced23]"
                    />
                  </div>
                </div>

                <button 
                  onClick={saveChanges}
                  disabled={saving}
                  className="w-full btn-primary"
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
