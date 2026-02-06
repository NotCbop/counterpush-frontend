import Head from 'next/head';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <Head>
        <title>Counterpush - Maintenance</title>
      </Head>
      
      <div className="text-center">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="font-display text-4xl md:text-6xl mb-4">
          <span className="gradient-text">UNDER</span>
          <br />
          <span className="text-white">MAINTENANCE</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          We're making some improvements. Check back soon!
        </p>
      </div>
    </div>
  );
}