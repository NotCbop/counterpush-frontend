import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function Stats() {
  const { data: session, status } = useSession();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.discordId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/players/${session.user.discordId}`);
        if (res.ok) {
          const data = await res.json();
          setPlayer(data);
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
      setLoading(false);
    };

    if (status !== 'loading') {
      fetchStats();
    }
  }, [session, status]);

  const getRankBg = (rank) => {
    const colors = {
      S: 'from-yellow-500 to-amber-600',
      A: 'from-purple-500 to-violet-600',
      B: 'from-blue-500 to-indigo-600',
      C: 'from-emerald-500 to-green-600',
      D: 'from-orange-500 to-red-600',
      F: 'from-gray-500 to-gray-600'
    };
    return colors[rank] || 'from-gray-500 to-gray-600';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="font-display text-2xl mb-4">Login Required</h1>
          <p className="text-gray-400 mb-6">Sign in with Discord to view your stats</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-dark-900 bg-noise">
        <Navbar />
        <div className="pt-24 pb-12 px-4 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="font-display text-2xl mb-4">No Stats Yet</h1>
          <p className="text-gray-400 mb-6">Play some games to see your stats!</p>
          <Link href="/create" className="btn-primary">Create a Lobby</Link>
        </div>
      </div>
    );
  }

  // Redirect to player profile page
  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 mb-4">Redirecting to your profile...</p>
          <Link href={`/player/${session.user.discordId}`} className="btn-primary">
            View Your Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
