import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EIP-7702 Revoker',
  description: 'Revoke EIP-7702 delegations with sponsored gas',
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