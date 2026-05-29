import { getChainById } from './networks';

interface Authorization {
  chainId: number;
  address: `0x${string}`;
  nonce: number;
  r: `0x${string}`;
  s: `0x${string}`;
  yParity: number;
}

export async function sendSponsoredTx(
  sponsorProvider: any,
  targetAddress: `0x${string}`,
  authorization: Authorization,
  chainId: number,
): Promise<`0x${string}`> {
  const chain = getChainById(chainId);
  if (!chain) throw new Error(`Unknown chain ${chainId}`);

  // Получаем адрес спонсора
  const accounts: string[] = await sponsorProvider.request({ method: 'eth_accounts' });
  if (!accounts?.length) throw new Error('No sponsor accounts found');
  const sponsorAddress = accounts[0] as `0x${string}`;

  // Переключаем спонсора на нужную сеть
  await sponsorProvider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: `0x${chainId.toString(16)}` }],
  });

  // Получаем fees
  let maxFeePerGas = '0x' + (300000000n).toString(16);
  let maxPriorityFeePerGas = '0x' + (100000000n).toString(16);
  try {
    const block = await sponsorProvider.request({
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    });
    if (block?.baseFeePerGas) {
      const base = BigInt(block.baseFeePerGas);
      const priority = 100000000n;
      maxFeePerGas = '0x' + ((base * 2n) + priority).toString(16);
      maxPriorityFeePerGas = '0x' + priority.toString(16);
    }
  } catch { }

  const txHash = await sponsorProvider.request({
    method: 'eth_sendTransaction',
    params: [{
      type: '0x4',
      from: sponsorAddress,
      to: targetAddress,
      value: '0x0',
      data: '0x',
      gas: '0x' + (200000n).toString(16),
      maxFeePerGas,
      maxPriorityFeePerGas,
      authorizationList: [{
        chainId: `0x${authorization.chainId.toString(16)}`,
        address: authorization.address,
        nonce: `0x${authorization.nonce.toString(16)}`,
        r: authorization.r,
        s: authorization.s,
        yParity: `0x${authorization.yParity.toString(16)}`,
      }],
    }],
  });

  return txHash as `0x${string}`;
}