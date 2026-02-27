import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLobby, setActiveLobby] = useState(null);
  const [mcData, setMcData] = useState(null);
  const router = useRouter();

  // Check for active lobby and fetch MC data
  useEffect(() => {
    const checkLobby = async () => {
      if (session?.user?.discordId) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/session/${session.user.discordId}`);
          const data = await res.json();
          if (data.lobbyId && data.lobby) {
            setActiveLobby(data.lobbyId);
          } else {
            setActiveLobby(null);
          }
        } catch (e) {
          setActiveLobby(null);
        }
      }
    };
    
    const fetchMcData = async () => {
      if (session?.user?.discordId) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/players/${session.user.discordId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.minecraftUuid) {
              setMcData({
                uuid: data.minecraftUuid,
                username: data.minecraftUsername
              });
            }
          }
        } catch (e) {
          console.error('Failed to fetch MC data:', e);
        }
      }
    };
    
    checkLobby();
    fetchMcData();
  }, [session]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (activeLobby) {
      router.push(`/lobby/${activeLobby}`);
    } else {
      router.push('/');
    }
  };

  // Display name and avatar - prioritize MC
  const displayName = mcData?.username || session?.user?.name;
  const avatarUrl = mcData?.uuid 
    ? `https://mc-heads.net/avatar/${mcData.uuid}/32`
    : session?.user?.image;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - left side */}
          <a href="#" onClick={handleLogoClick} className="flex items-center gap-2 group cursor-pointer flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Counterpush" 
              className="w-8 h-8 rounded-lg group-hover:scale-110 transition-transform"
            />
            <span className="font-display text-xl hidden sm:block gradient-text-animated">COUNTERPUSH</span>
          </a>

          {/* Desktop Navigation - centered */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/create" className="text-gray-300 hover:text-white transition-colors text-sm">
              Play
            </Link>
            <Link href="/browse" className="text-gray-300 hover:text-white transition-colors text-sm">
              Browse
            </Link>
            <Link href="/leaderboard" className="text-gray-300 hover:text-white transition-colors text-sm">
              ELO Leaderboard
            </Link>
            <Link href="/stats-leaderboard" className="text-gray-300 hover:text-white transition-colors text-sm">
              Stats Leaderboard
            </Link>
            <Link href="/matches" className="text-gray-300 hover:text-white transition-colors text-sm">
              Matches
            </Link>
            <Link href="/link" className="text-gray-300 hover:text-white transition-colors text-sm">
              Link
            </Link>
            {session && (
              <Link href={`/player/${session.user.discordId}`} className="text-gray-300 hover:text-white transition-colors text-sm">
                Profile
              </Link>
            )}
          </div>

          {/* Auth Section - right side */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ boxShadow: '0 0 0 2px rgba(156, 237, 35, 0.5)' }}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-dark-600 flex items-center justify-center text-sm">
                      {displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">{displayName}</span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('discord')}
                className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="hidden sm:block">Login with Discord</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-600">
            <div className="flex flex-col gap-4">
              <Link href="/create" className="text-gray-300 hover:text-white transition-colors">
                Play
              </Link>
              <Link href="/browse" className="text-gray-300 hover:text-white transition-colors">
                Browse
              </Link>
              <Link href="/leaderboard" className="text-gray-300 hover:text-white transition-colors">
                ELO Leaderboard
              </Link>
              <Link href="/stats-leaderboard" className="text-gray-300 hover:text-white transition-colors">
                Stats Leaderboard
              </Link>
              <Link href="/matches" className="text-gray-300 hover:text-white transition-colors">
                Matches
              </Link>
              <Link href="/link" className="text-gray-300 hover:text-white transition-colors">
                Link
              </Link>
              {session && (
                <Link href={`/player/${session.user.discordId}`} className="text-gray-300 hover:text-white transition-colors">
                  Profile
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
