'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import { supportedChains } from '@/utils/networks';

const RevokeSection = dynamic(() => import('@/components/RevokeSection'), { ssr: false });
const HelpModal = dynamic(() => import('@/components/HelpModal'), { ssr: false });

const SPONSOR_ADDRESS = '0x3F7Bd7b07A47071D824795F9CB2AcB28395056dA';

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function Header() {
  return (
    <header className="w-full flex items-center justify-between mb-2">
      <span className="text-xs text-zinc-600 font-mono">v1.0</span>
      <div className="flex items-center gap-3">
        <a
          href="https://github.com/Serge693/EIP7702-revoker-WEB"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <GithubIcon />
          GitHub
        </a>
        <a
          href="https://t.me/Sergio6967"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#229ED9] hover:text-[#1a8bbf] transition-colors"
        >
          <TelegramIcon />
          Telegram
        </a>
      </div>
    </header>
  );
}

function SponsorBanner() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(SPONSOR_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
      <p className="text-xs text-zinc-400">
        ⛽ <span className="text-white">Gas is sponsored — revocation is free.</span>{' '}Support the project:
      </p>
      <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
        <span className="font-mono text-xs text-zinc-300 truncate flex-1">{SPONSOR_ADDRESS}</span>
        <button onClick={copy} className="text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <a
          href={`https://etherscan.io/address/${SPONSOR_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
        >↗</a>
      </div>
    </div>
  );
}

function SupportedNetworks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <span>🌐 Supported Networks ({supportedChains.length})</span>
        <span className={`text-zinc-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 pb-4">
          {supportedChains.map(c => (
            <div key={c.id} className="flex items-center justify-between py-1 border-b border-zinc-800/50">
              <span className="text-xs text-zinc-300">{c.name}</span>
              <span className="text-xs text-zinc-600 font-mono">{c.id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <div className="text-center text-xs text-zinc-600 space-y-1 pb-4">
      <p>MIT License · Built for the Ethereum community</p>
      <p>
        <a href="https://eips.ethereum.org/EIPS/eip-7702" target="_blank" rel="noopener noreferrer"
          className="hover:text-zinc-400 transition-colors underline">
          EIP-7702 Spec
        </a>
        {' · '}
        <a href="https://github.com/Serge693/EIP7702-revoker-WEB/issues" target="_blank" rel="noopener noreferrer"
          className="hover:text-zinc-400 transition-colors underline">
          Report Issue
        </a>
      </p>
    </div>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-5">

        <Header />

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
        <SupportedNetworks />
        <Footer />

      </div>

      {mounted && <HelpModal />}
    </main>
  );
}
