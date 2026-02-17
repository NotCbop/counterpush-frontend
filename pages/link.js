import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function LinkPage() {
  const { data: session, status } = useSession();
  const [linkedAccount, setLinkedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);
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

  // Check for pending link code
  useEffect(() => {
    const checkPendingCode = async () => {
      if (!session?.user?.discordId) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/link/code/${session.user.discordId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.code) {
            setLinkCode(data.code);
          }
        }
      } catch (e) {
        console.error('Failed to check pending code:', e);
      }
    };

    checkPendingCode();
  }, [session]);

  // Poll for link completion
  useEffect(() => {
    if (!linkCode || linkedAccount) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/link/minecraft/${session.user.discordId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.uuid) {
            setLinkedAccount(data);
            setLinkCode(null);
            setSuccess('Account linked successfully!');
          }
        }
      } catch (e) {
        // ignore
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [linkCode, linkedAccount, session]);

  const generateLinkCode = async () => {
    setGeneratingCode(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/link/generate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: session.user.discordId,
          username: session.user.name
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to generate code');
      } else {
        setLinkCode(data.code);
      }
    } catch (e) {
      setError('Failed to connect to server');
    }

    setGeneratingCode(false);
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink your Minecraft account?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/link/minecraft/${session.user.discordId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setLinkedAccount(null);
        setLinkCode(null);
        setSuccess('Account unlinked successfully');
      }
    } catch (e) {
      setError('Failed to unlink account');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`/link ${linkCode}`);
    setSuccess('Command copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
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
                    <div className="text-green-400 text-sm">✓ Minecraft Account Linked</div>
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
                <p className="text-yellow-400 text-sm mt-2">⚠️ You must link your account to play!</p>
              </div>
            )}
          </div>

          {/* Link Instructions */}
          {!linkedAccount && (
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8">
              <h2 className="font-display text-xl mb-4">How to Link</h2>

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

              {!linkCode ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-dark-700 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-[#9ced23] text-black flex items-center justify-center font-bold">1</div>
                    <div>
                      <div className="font-semibold">Generate a link code</div>
                      <div className="text-gray-400 text-sm">Click the button below to get your unique code</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-dark-700 rounded-lg opacity-50">
                    <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center font-bold">2</div>
                    <div>
                      <div className="font-semibold">Join the Minecraft server</div>
                      <div className="text-gray-400 text-sm">Connect to the Counterpush server</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-dark-700 rounded-lg opacity-50">
                    <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center font-bold">3</div>
                    <div>
                      <div className="font-semibold">Run the /link command</div>
                      <div className="text-gray-400 text-sm">Type /link [your code] in game</div>
                    </div>
                  </div>

                  <button 
                    onClick={generateLinkCode}
                    disabled={generatingCode}
                    className="w-full btn-primary mt-4"
                  >
                    {generatingCode ? 'Generating...' : '🔗 Generate Link Code'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-dark-700 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-black flex items-center justify-center">✓</div>
                    <div>
                      <div className="font-semibold text-green-400">Code Generated!</div>
                      <div className="text-gray-400 text-sm">Your code is ready</div>
                    </div>
                  </div>

                  <div className="bg-dark-700 rounded-xl p-6 text-center">
                    <div className="text-gray-400 text-sm mb-2">Your Link Code:</div>
                    <div className="font-mono text-4xl text-[#9ced23] mb-4 tracking-widest">{linkCode}</div>
                    <button 
                      onClick={copyCode}
                      className="px-4 py-2 bg-dark-600 hover:bg-dark-500 rounded-lg text-sm transition-colors"
                    >
                      📋 Copy Command: /link {linkCode}
                    </button>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-dark-700 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-[#9ced23] text-black flex items-center justify-center font-bold">2</div>
                    <div>
                      <div className="font-semibold">Join the Minecraft server</div>
                      <div className="text-gray-400 text-sm">Server IP: <span className="text-white font-mono">play.counterpush.net</span></div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-dark-700 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-[#9ced23] text-black flex items-center justify-center font-bold">3</div>
                    <div>
                      <div className="font-semibold">Run the command in-game</div>
                      <div className="text-gray-400 text-sm">Type: <span className="text-white font-mono">/link {linkCode}</span></div>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <div className="animate-pulse text-gray-400">
                      ⏳ Waiting for you to link in-game...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>Linking your account allows your in-game stats to be tracked.</p>
            <p className="mt-1">Code expires in 10 minutes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

