import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function LinkPage() {
  const { data: session, status } = useSession();
  const [minecraftUsername, setMinecraftUsername] = useState('');
  const [linkedAccount, setLinkedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchLinkedAccount = async () => {
      if (!session?.user?.discordId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/link/minecraft/${session.user.discordId}`);
        if (res.ok) {
          const data = await res.json();
          setLinkedAccount(data);
        }
      } catch (e) {
        console.error('Failed to fetch linked account:', e);
      }
      setLoading(false);
    };

    if (status !== 'loading') {
      fetchLinkedAccount();
    }
  }, [session, status]);

  const handleLink = async () => {
    if (!minecraftUsername.trim()) {
      setError('Please enter your Minecraft username');
      return;
    }

    setLinking(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/link/minecraft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: session.user.discordId,
          minecraftUsername: minecraftUsername.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to link account');
      } else {
        setSuccess(`Successfully linked to ${data.minecraft.username}!`);
        setLinkedAccount({ uuid: data.minecraft.uuid, username: data.minecraft.username });
        setMinecraftUsername('');
      }
    } catch (e) {
      setError('Failed to connect to server');
    }

    setLinking(false);
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink your Minecraft account?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/link/minecraft/${session.user.discordId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setLinkedAccount(null);
        setSuccess('Account unlinked successfully');
      }
    } catch (e) {
      setError('Failed to unlink account');
    }
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
          <p className="text-gray-400 mb-6">Sign in with Discord to link your Minecraft account</p>
          <button onClick={() => signIn('discord')} className="btn-primary">
            Login with Discord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-noise">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-xl mx-auto">
          <h1 className="font-display text-4xl text-center mb-8">LINK MINECRAFT</h1>

          {/* Current Link Status */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 mb-6">
            <h2 className="font-display text-xl mb-4">Current Status</h2>
            
            {linkedAccount ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src={`https://mc-heads.net/avatar/${linkedAccount.uuid}/64`}
                    alt={linkedAccount.username}
                    className="w-16 h-16 rounded-lg"
                  />
                  <div>
                    <div className="font-semibold text-lg">{linkedAccount.username}</div>
                    <div className="text-gray-500 text-sm">Minecraft Account Linked ✓</div>
                  </div>
                </div>
                <button 
                  onClick={handleUnlink}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
                >
                  Unlink
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">⛏️</div>
                <p className="text-gray-400">No Minecraft account linked</p>
              </div>
            )}
          </div>

          {/* Link Form */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8">
            <h2 className="font-display text-xl mb-4">
              {linkedAccount ? 'Link Different Account' : 'Link Your Account'}
            </h2>
            
            <p className="text-gray-400 mb-6">
              Enter your Minecraft username to link it with your Discord account. 
              This allows your in-game stats (K/D/A, damage, healing) to show on your profile.
            </p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4 text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4 text-green-400">
                {success}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Minecraft Username</label>
              <input
                type="text"
                value={minecraftUsername}
                onChange={(e) => setMinecraftUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg focus:outline-none"
                style={{ borderColor: minecraftUsername ? '#9ced23' : '' }}
                onKeyPress={(e) => e.key === 'Enter' && handleLink()}
              />
            </div>

            <button 
              onClick={handleLink} 
              disabled={linking || !minecraftUsername.trim()}
              className="w-full btn-primary disabled:opacity-50"
            >
              {linking ? 'Linking...' : 'Link Account'}
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>Your in-game stats will be displayed on your profile and match history.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
