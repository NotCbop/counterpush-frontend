import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import io from 'socket.io-client';

// Team color definitions
const TEAM_COLORS = {
  0: { name: 'White', text: 'text-gray-200' },
  1: { name: 'Blue', text: 'text-blue-400' },
  2: { name: 'Purple', text: 'text-purple-400' },
  3: { name: 'Green', text: 'text-green-400' },
  4: { name: 'Yellow', text: 'text-yellow-400' },
  5: { name: 'Red', text: 'text-red-400' },
  6: { name: 'Pink', text: 'text-pink-400' },
  7: { name: 'Orange', text: 'text-orange-400' }
};

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
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${lobby.isRanked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                              {lobby.isRanked ? '⭐ Ranked' : '🎮 Casual'}
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-sm ${
                              lobby.playerCount >= lobby.maxPlayers 
                                ? 'bg-yellow-500/20 text-yellow-400' 
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {lobby.playerCount}/{lobby.maxPlayers}
                              {lobby.playerCount >= lobby.maxPlayers && ' ⚡'}
                            </span>
                          </div>
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
                    {ongoingLobbies.map(lobby => {
                      const team1Color = TEAM_COLORS[lobby.team1Color || 1];
                      const team2Color = TEAM_COLORS[lobby.team2Color || 5];
                      
                      return (
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
                                <span className={team1Color.text}>{lobby.score.team1}</span>
                                <span className="text-gray-500">-</span>
                                <span className={team2Color.text}>{lobby.score.team2}</span>
                              </div>
                            )}
                          </div>

                          <div className="bg-dark-700 rounded-lg p-3 text-center text-gray-500 text-sm">
                            Match in progress...
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No lobbies at all */}
              {lobbies.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎮</div>
                  <h2 className="font-display text-2xl mb-2">No Ranked Lobbies</h2>
                  <p className="text-gray-400 mb-6">
                    Ranked sessions are organized in our Discord. Join to find active games!
                  </p>

                  <Link
                    href="https://discord.gg/YJkbX8TRp5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
                  >
                    {/* Discord Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 127.14 96.36"
                      className="w-5 h-5 fill-current"
                    >
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.91A97.68,97.68,0,0,0,49,6.91,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.61.53,80.21A105.73,105.73,0,0,0,32.71,96.36a77.7,77.7,0,0,0,6.89-11.18,68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.35,2.66-2.07a75.57,75.57,0,0,0,64.32,0c.87.72,1.76,1.41,2.66,2.07a68.68,68.68,0,0,1-10.87,5.19,77.31,77.31,0,0,0,6.89,11.17A105.25,105.25,0,0,0,126.6,80.22C129.24,52.84,121.17,29.11,107.7,8.07ZM42.45,65.69c-6.26,0-11.4-5.73-11.4-12.77S36.09,40.15,42.45,40.15s11.5,5.79,11.4,12.77C53.85,59.96,48.81,65.69,42.45,65.69Zm42.24,0c-6.26,0-11.4-5.73-11.4-12.77S78.33,40.15,84.69,40.15s11.5,5.79,11.4,12.77C96.09,59.96,91.05,65.69,84.69,65.69Z" />
                    </svg>

                    Join Discord
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
