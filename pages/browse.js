import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import io from 'socket.io-client';

export default function Browse() {
  const { data: session } = useSession();
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('getPublicLobbies');
      setLoading(false);
    });

    newSocket.on('lobbiesUpdate', (data) => {
      setLobbies(data);
    });

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      newSocket.emit('getPublicLobbies');
    }, 10000);

    return () => {
      clearInterval(interval);
      newSocket.close();
    };
  }, []);

  const refresh = () => {
    if (socket) {
      socket.emit('getPublicLobbies');
    }
  };

  // Separate lobbies by phase
  const waitingLobbies = lobbies.filter(l => l.phase === 'waiting');
  const ongoingLobbies = lobbies.filter(l => l.phase !== 'waiting');

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-4xl">LOBBY BROWSER</h1>
            <button onClick={refresh} className="btn-secondary text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <>
              {/* Waiting Lobbies */}
              {waitingLobbies.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    Open Lobbies
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {waitingLobbies.map(lobby => (
                      <div key={lobby.id} className="bg-dark-800 border border-dark-600 rounded-xl p-6 card-hover">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-mono text-2xl tracking-widest gradient-text">{lobby.id}</span>
                          <span className={`px-3 py-1 rounded-lg text-sm ${
                            lobby.playerCount >= lobby.maxPlayers 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {lobby.playerCount}/{lobby.maxPlayers}
                            {lobby.playerCount >= lobby.maxPlayers && ' ⚡'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center">
                            {lobby.host.avatar ? (
                              <img src={lobby.host.avatar} alt="" className="w-full h-full rounded-full" />
                            ) : (
                              <span>{lobby.host.username?.[0] || '?'}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-300">{lobby.host.username}</div>
                            <div className="text-xs text-gray-500">Host</div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 mb-4">
                          Created {new Date(lobby.createdAt).toLocaleTimeString()}
                        </div>

                        {session ? (
                          <Link 
                            href={`/lobby/${lobby.id}`} 
                            className="btn-primary w-full text-center block"
                          >
                            {lobby.playerCount >= lobby.maxPlayers ? 'Join (Purge Mode ⚡)' : 'Join Lobby'}
                          </Link>
                        ) : (
                          <button onClick={() => signIn('discord')} className="btn-primary w-full">
                            Login to Join
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ongoing Lobbies */}
              {ongoingLobbies.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
                    Ongoing Matches
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {ongoingLobbies.map(lobby => (
                      <div key={lobby.id} className="bg-dark-800 border border-orange-500/30 rounded-xl p-6 opacity-80">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-mono text-2xl tracking-widest text-orange-400">{lobby.id}</span>
                          <span className="px-3 py-1 rounded-lg text-sm bg-orange-500/20 text-orange-400">
                            🎮 In Game
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center">
                            {lobby.host.avatar ? (
                              <img src={lobby.host.avatar} alt="" className="w-full h-full rounded-full" />
                            ) : (
                              <span>{lobby.host.username?.[0] || '?'}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-300">{lobby.host.username}</div>
                            <div className="text-xs text-gray-500">Host</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm text-gray-400">
                            {lobby.playerCount} players
                          </div>
                          {lobby.score && (
                            <div className="flex items-center gap-2 text-lg font-mono">
                              <span className="text-blue-400">{lobby.score.team1}</span>
                              <span className="text-gray-500">-</span>
                              <span className="text-red-400">{lobby.score.team2}</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-dark-700 rounded-lg p-3 text-center text-gray-500 text-sm">
                          Match in progress...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No lobbies at all */}
              {lobbies.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎮</div>
                  <h2 className="font-display text-2xl mb-2">No Public Lobbies</h2>
                  <p className="text-gray-400 mb-6">Be the first to create one!</p>
                  <Link href="/create" className="btn-primary">Create Lobby</Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
