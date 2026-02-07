import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import io from 'socket.io-client';

export default function CreateLobby() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [existingLobby, setExistingLobby] = useState(null);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    const checkExistingLobby = async () => {
      if (session?.user?.discordId) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/session/${session.user.discordId}`);
          const data = await res.json();
          if (data.lobbyId && data.lobby) {
            setExistingLobby(data);
          }
        } catch (e) {
          console.error('Failed to check session:', e);
        }
      }
      setCheckingSession(false);
    };

    if (status !== 'loading') {
      checkExistingLobby();
    }
  }, [session, status]);

  const rejoinLobby = () => {
    router.push(`/lobby/${existingLobby.lobbyId}`);
  };

  const clearSession = () => {
    setExistingLobby(null);
  };

  const handleCreate = () => {
    if (!session) return;

    setCreating(true);

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');

    socket.on('connect', () => {
      const userData = {
        odiscordId: session.user.discordId,
        username: session.user.name,
        avatar: session.user.image
      };

      socket.emit('createLobby', { userData, maxPlayers, isPublic });
    });

    socket.on('connect_error', (err) => {
      alert('Cannot connect to server. Please try again.');
      setCreating(false);
    });

    socket.on('lobbyCreated', (lobby) => {
      router.push(`/lobby/${lobby.id}`);
    });

    socket.on('error', (err) => {
      alert(err.message);
      setCreating(false);
    });
  };

  const handleJoinLobby = () => {
    if (joinCode.trim().length >= 4) {
      router.push(`/lobby/${joinCode.toUpperCase()}`);
    }
  };

  if (status === 'loading' || checkingSession) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl text-center mb-8">
            {existingLobby ? 'ACTIVE LOBBY FOUND' : 'PLAY'}
          </h1>

          {existingLobby && (
            <div className="bg-dark-800 border rounded-2xl p-8 mb-6" style={{ borderColor: 'rgba(156, 237, 35, 0.5)' }}>
              <div className="text-center">
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="font-display text-2xl mb-2">You're in a lobby!</h2>
                <p className="text-gray-400 mb-2">
                  Lobby Code: <span className="font-mono text-white text-xl">{existingLobby.lobbyId}</span>
                </p>
                <div className="flex flex-col gap-3">
                  <button onClick={rejoinLobby} className="btn-primary text-lg w-full">Rejoin Lobby</button>
                  <button onClick={clearSession} className="btn-secondary text-sm text-gray-400">Leave & Create New</button>
                </div>
              </div>
            </div>
          )}

          {!existingLobby && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Create Lobby */}
              <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8">
                <h2 className="font-display text-2xl mb-6 text-center">CREATE LOBBY</h2>
                
                {/* Public/Private Toggle */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-dark-600">
                  <div>
                    <div className="font-semibold">Public Lobby</div>
                    <div className="text-sm text-gray-400">Show in lobby browser</div>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors`} style={{ backgroundColor: isPublic ? '#9ced23' : '#22222e' }}>
                      <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                </div>

                {/* Max Players */}
                <div className="mb-6">
                  <label className="block font-semibold mb-4">Max Players</label>
                  <div className="grid grid-cols-5 gap-3">
                    {[2, 4, 6, 8, 10].map(num => (
                      <button
                        key={num}
                        onClick={() => setMaxPlayers(num)}
                        className={`py-3 rounded-lg font-mono text-lg transition-all ${
                          maxPlayers === num ? 'text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                        }`}
                        style={maxPlayers === num ? { background: 'linear-gradient(135deg, #9ced23 0%, #0d52ad 100%)' } : {}}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {maxPlayers / 2} player{maxPlayers / 2 !== 1 ? 's' : ''} per team
                    {maxPlayers === 2 && <span className="text-yellow-400 ml-2">(Test Mode)</span>}
                  </p>
                </div>

                {session ? (
                  <button onClick={handleCreate} disabled={creating} className="w-full btn-primary text-lg disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create Lobby'}
                  </button>
                ) : (
                  <button onClick={() => signIn('discord')} className="w-full btn-primary text-lg flex items-center justify-center gap-2">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Login to Create
                  </button>
                )}
              </div>

              {/* Join Lobby */}
              <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8">
                <h2 className="font-display text-2xl mb-6 text-center">JOIN LOBBY</h2>
                
                <div className="mb-6">
                  <label className="block font-semibold mb-4">Lobby Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full px-4 py-4 bg-dark-700 border border-dark-500 rounded-lg text-center text-3xl font-mono tracking-widest focus:outline-none"
                    onFocus={(e) => e.target.style.borderColor = '#9ced23'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  />
                </div>

                {session ? (
                  <button 
                    onClick={handleJoinLobby} 
                    disabled={joinCode.length < 4}
                    className="w-full btn-primary text-lg disabled:opacity-50"
                  >
                    Join Lobby
                  </button>
                ) : (
                  <button onClick={() => signIn('discord')} className="w-full btn-primary text-lg flex items-center justify-center gap-2">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Login to Join
                  </button>
                )}

                <div className="mt-6 pt-6 border-t border-dark-600 text-center">
                  <p className="text-gray-500 text-sm mb-3">Or find a public lobby</p>
                  <a href="/browse" className="text-sm hover:underline" style={{ color: '#9ced23' }}>
                    Browse Public Lobbies →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
