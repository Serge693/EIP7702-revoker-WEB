import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { supportedChains, getChainById } from '@/utils/networks';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address') as `0x${string}` | null;
  const chainIdParam = request.nextUrl.searchParams.get('chainId');

  if (!address) {
    return NextResponse.json({ error: 'Missing address' }, { status: 400 });
  }

  try {
    if (chainIdParam) {
      const chainId = Number(chainIdParam);
      return NextResponse.json(await checkSingleNetwork(address, chainId));
    }

    const results = await Promise.all(
      supportedChains.map((chain) => checkSingleNetwork(address, chain.id)),
    );

    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function checkSingleNetwork(address: `0x${string}`, chainId: number) {
  const chain = getChainById(chainId);
  if (!chain) {
    return { chainId, chainName: `Chain ${chainId}`, delegated: false, delegateTo: null, error: 'Unknown chain' };
  }

  try {
    const client = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    });

    const code = await client.getCode({ address });
    const isDelegated = typeof code === 'string' && code.toLowerCase().startsWith('0xef0100');
    const delegateTo = isDelegated && code
      ? (`0x${code.slice(8)}` as `0x${string}`)
      : null;

    return { chainId: chain.id, chainName: chain.name, delegated: isDelegated, delegateTo };
  } catch (e: any) {
    return { chainId, chainName: chain.name, delegated: false, delegateTo: null, error: e.message };
  }
}