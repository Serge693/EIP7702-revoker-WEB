'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';

const RevokeSection = dynamic(() => import('@/components/RevokeSection'), { ssr: false });
const HelpModal = dynamic(() => import('@/components/HelpModal'), { ssr: false });

const SPONSOR_ADDRESS = '0x3F7Bd7b07A47071D824795F9CB2AcB28395056dA';

function SponsorBanner() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(SPONSOR_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-400">
          ⛽ {' '}
          <span className="text-white">Gas is sponsored — revocation is free.</span>
          {' '}Support the project:
        </p>
      </div>
      <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
        <span className="font-mono text-xs text-zinc-300 truncate flex-1">
          {SPONSOR_ADDRESS}
        </span>
        <button
          onClick={copy}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <a
          href={`https://etherscan.io/address/${SPONSOR_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
        >
          ↗
        </a>
      </div>
    </div>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">EIP-7702 Revoker</h1>
          <p className="text-gray-400">Revoke EIP-7702 delegations — gas is paid by sponsor wallet</p>
          <p className="text-xs text-zinc-500">
            No server, no private key storage — everything happens in your browser
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <p className="text-sm text-gray-400">
            Connect the <span className="text-white font-medium">compromised wallet</span> to scan for delegations
          </p>
          <div className="flex justify-start">
            <ConnectButton />
          </div>
        </div>

        {mounted && isConnected && address ? (
          <RevokeSection address={address} />
        ) : (
          <div className="text-center text-gray-500 text-sm">
            Connect compromised wallet to get started
          </div>
        )}

        <SponsorBanner />

      </div>

      {mounted && <HelpModal />}
    </main>
  );
}
