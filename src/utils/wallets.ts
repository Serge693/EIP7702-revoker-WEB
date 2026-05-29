export interface WalletProvider {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

export function discoverWallets(): Promise<WalletProvider[]> {
  return new Promise((resolve) => {
    const wallets: WalletProvider[] = [];

    const handler = (event: any) => {
      wallets.push(event.detail);
    };

    window.addEventListener('eip6963:announceProvider', handler as any);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Даём 500ms на сбор всех кошельков
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', handler as any);
      resolve(wallets);
    }, 500);
  });
}