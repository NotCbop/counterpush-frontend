import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeLobby, setActiveLobby] = useState(null);

  // Check if user is already in a lobby
  useEffect(() => {
    const checkExistingLobby = async () => {
      // Check test mode first
      const isTestMode = localStorage.getItem('testMode') === 'true';
      const storedTestUser = localStorage.getItem('testUser');
      
      if (isTestMode && storedTestUser) {
        const testUser = JSON.parse(storedTestUser);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/session/${testUser.odiscordId}`);
          const data = await res.json();
          if (data.lobbyId) {
            setActiveLobby(data.lobbyId);
            return;
          }
        } catch (e) {
          console.error('Failed to check session:', e);
        }
      }
      
      // Check Discord session
      if (session?.user?.discordId) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/session/${session.user.discordId}`);
          const data = await res.json();
          if (data.lobbyId) {
            setActiveLobby(data.lobbyId);
          }
        } catch (e) {
          console.error('Failed to check session:', e);
        }
      }
    };

    if (status !== 'loading') {
      checkExistingLobby();
    }
  }, [session, status]);

  const handleJoinLobby = () => {
    if (joinCode.trim()) {
      router.push(`/lobby/${joinCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(156, 237, 35, 0.15)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(13, 82, 173, 0.2)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700/50 border border-dark-500 rounded-full text-sm mb-8 animate-slide-up">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-300">Season 1 Active</span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-6xl md:text-8xl mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="gradient-text">COUNTER</span>
            <br />
            <span className="text-white">PUSH</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Competitive team drafting with ELO rankings. Create a lobby, draft your team, and climb the leaderboard.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {activeLobby ? (
              <>
                <Link href={`/lobby/${activeLobby}`} className="btn-primary text-lg">
                  Rejoin Lobby ({activeLobby})
                </Link>
                <button 
                  onClick={() => setShowJoinModal(true)} 
                  className="btn-secondary text-lg"
                >
                  Join Different Lobby
                </button>
              </>
            ) : session ? (
              <>
                <Link href="/create" className="btn-primary text-lg">
                  Create Lobby
                </Link>
                <button 
                  onClick={() => setShowJoinModal(true)} 
                  className="btn-secondary text-lg"
                >
                  Join Lobby
                </button>
              </>
            ) : (
              <button onClick={() => signIn('discord')} className="btn-primary text-lg flex items-center justify-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Login with Discord
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 max-w-md w-full animate-slide-up">
            <h2 className="font-display text-2xl mb-6">JOIN LOBBY</h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter lobby code"
              maxLength={6}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none mb-6"
              style={{ '--focus-color': '#9ced23' }}
              onFocus={(e) => e.target.style.borderColor = '#9ced23'}
              onBlur={(e) => e.target.style.borderColor = ''}
              autoFocus
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinLobby}
                disabled={joinCode.length < 4}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl text-center mb-16">HOW IT WORKS</h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: 'linear-gradient(135deg, #9ced23 0%, #7bc41a 100%)' }}>
                1
              </div>
              <h3 className="font-display text-xl mb-2">CREATE</h3>
              <p className="text-gray-400 text-sm">
                Host creates a lobby and shares the code with players.
              </p>
            </div>

            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: 'linear-gradient(135deg, #0d52ad 0%, #093d82 100%)' }}>
                2
              </div>
              <h3 className="font-display text-xl mb-2">JOIN</h3>
              <p className="text-gray-400 text-sm">
                Players join with the code. First come, first served.
              </p>
            </div>

            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: 'linear-gradient(135deg, #9ced23 0%, #0d52ad 100%)' }}>
                3
              </div>
              <h3 className="font-display text-xl mb-2">DRAFT</h3>
              <p className="text-gray-400 text-sm">
                Host picks captains, then captains draft their teams.
              </p>
            </div>

            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: 'linear-gradient(135deg, #0d52ad 0%, #9ced23 100%)' }}>
                4
              </div>
              <h3 className="font-display text-xl mb-2">PLAY</h3>
              <p className="text-gray-400 text-sm">
                Battle it out and claim victory!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ranks Section */}
      <section className="py-20 px-4 bg-dark-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">RANK TIERS</h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Climb the ranks and prove your worth.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { rank: 'S', elo: '1400+', color: 'from-yellow-500 to-amber-600', glow: 'shadow-yellow-500/30' },
              { rank: 'A', elo: '1250+', color: 'from-purple-500 to-violet-600', glow: 'shadow-purple-500/30' },
              { rank: 'B', elo: '1100+', color: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/30' },
              { rank: 'C', elo: '950+', color: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/30' },
              { rank: 'D', elo: '800+', color: 'from-orange-500 to-red-600', glow: 'shadow-orange-500/30' },
              { rank: 'F', elo: '<800', color: 'from-gray-500 to-gray-600', glow: 'shadow-gray-500/30' },
            ].map((tier, i) => (
              <div
                key={tier.rank}
                className={`bg-dark-700 border border-dark-500 rounded-xl p-6 text-center card-hover shadow-lg ${tier.glow}`}
              >
                <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center font-display text-3xl mb-4`}>
                  {tier.rank}
                </div>
                <div className="font-mono text-sm text-gray-400">{tier.elo} ELO</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-dark-700">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-display" style={{ background: 'linear-gradient(135deg, #9ced23 0%, #0d52ad 100%)' }}>
              CP
            </div>
            <span className="font-display">COUNTERPUSH</span>
          </div>
          <div className="text-gray-500 text-sm">
            © 2024 Counterpush. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
