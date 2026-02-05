import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import io from 'socket.io-client';

export default function CreateLobby() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [creating, setCreating] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [existingLobby, setExistingLobby] = useState(null);

  // Check if user is already in a lobby
  useEffect(() => {
    const checkExistingLobby = async () => {
      // Check Discord session
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
      console.log('Connected to server');
      
      if (!session?.user?.discordId) {
        console.error('No Discord ID in session!', session);
        alert('Session error: No Discord ID found. Try logging out and back in.');
        setCreating(false);
        socket.disconnect();
        return;
      }
      
      const userData = {
        odiscordId: session.user.discordId,
        username: session.user.name,
        avatar: session.user.image
      };

      console.log('Emitting createLobby with:', { userData, maxPlayers });
      socket.emit('createLobby', { userData, maxPlayers });
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      alert('Cannot connect to server. Please try again.');
      setCreating(false);
    });

    socket.on('lobbyCreated', (lobby) => {
      console.log('Lobby created:', lobby);
      router.push(`/lobby/${lobby.id}`);
    });

    socket.on('error', (err) => {
      console.error('Server error:', err);
      alert(err.message);
      setCreating(false);
    });
  };

  if (status === 'loading' || checkingSession) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
          <p className="text-gray-400">{checkingSession ? 'Checking for active lobby...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-xl mx-auto">
          <h1 className="font-display text-4xl text-center mb-8">
            {existingLobby ? 'ACTIVE LOBBY FOUND' : 'CREATE LOBBY'}
          </h1>

          {/* Existing Lobby Prompt */}
          {existingLobby && (
            <div className="bg-dark-800 border rounded-2xl p-8 mb-6" style={{ borderColor: 'rgba(156, 237, 35, 0.5)' }}>
              <div className="text-center">
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="font-display text-2xl mb-2">You're in a lobby!</h2>
                <p className="text-gray-400 mb-2">
                  Lobby Code: <span className="font-mono text-white text-xl">{existingLobby.lobbyId}</span>
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  {existingLobby.lobby?.players?.length || 0} players • {existingLobby.lobby?.phase || 'waiting'}
                </p>
                
                <div className="flex flex-col gap-3">
                  <button onClick={rejoinLobby} className="btn-primary text-lg w-full">
                    Rejoin Lobby
                  </button>
                  <button onClick={clearSession} className="btn-secondary text-sm text-gray-400">
                    Leave & Create New
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Form - only show if no existing lobby */}
          {!existingLobby && (
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8">
              {/* Max Players */}
              <div className="mb-8">
                <label className="block font-semibold mb-4">Max Players</label>
                <div className="grid grid-cols-4 gap-3">
                  {[4, 6, 8, 10].map(num => (
                    <button
                      key={num}
                      onClick={() => setMaxPlayers(num)}
                      className={`py-3 rounded-lg font-mono text-lg transition-all ${
                        maxPlayers === num
                          ? 'text-white'
                          : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                      }`}
                      style={maxPlayers === num ? { background: 'linear-gradient(135deg, #9ced23 0%, #0d52ad 100%)' } : {}}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {maxPlayers / 2} players per team
                </p>
              </div>

              {/* Create Button */}
              {session ? (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full btn-primary text-lg disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Lobby'}
                </button>
              ) : (
                <button
                  onClick={() => signIn('discord')}
                  className="w-full btn-primary text-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Login with Discord to Create
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
