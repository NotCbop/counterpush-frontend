import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';

export default function Stats() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.discordId) {
      router.replace(`/player/${session.user.discordId}`);
    }
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (status === 'unauthenticated') {
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

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#9ced23', borderTopColor: 'transparent' }} />
    </div>
  );
}
