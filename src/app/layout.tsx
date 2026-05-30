import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EIP-7702 Revoker — Gasless Delegation Revocation',
  description:
    'Safely revoke EIP-7702 smart contract delegations from compromised wallets — gas is paid by a sponsor, no ETH required. Supports 19 networks.',
  keywords: ['EIP-7702', 'ethereum', 'wallet security', 'delegation', 'revoke', 'gasless'],
  openGraph: {
    title: 'EIP-7702 Revoker',
    description: 'Revoke malicious EIP-7702 delegations gaslessly across 19 networks.',
    url: 'https://eip-7702-revoker-web.vercel.app',
    siteName: 'EIP-7702 Revoker',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'EIP-7702 Revoker',
    description: 'Revoke malicious EIP-7702 delegations gaslessly across 19 networks.',
  },
  icons: {
    icon: '/favicon.svg',
  },
  other: {
    'base:app_id': '6a1a08091c5aec425c51b7ef',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
