import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, formatEther } from 'viem';
import { recoverAuthorizationAddress } from 'viem/experimental';
import { privateKeyToAccount } from 'viem/accounts';
import { getChainById } from '@/utils/networks';

// ─── Rate limiting ────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Authorization {
  chainId: number;
  address: `0x${string}`;
  nonce: number;
  r: `0x${string}`;
  s: `0x${string}`;
  yParity: number;
}

interface RevokeBody {
  address: `0x${string}`;
  authorization: Authorization;
  chainId: number;
}

// ─── Gas fallbacks ────────────────────────────────────────────────────────────
const GAS_FALLBACK: Record<number, bigint> = {
  1:       200000n,
  8453:    200000n,
  42161:   200000n,
  10:      200000n,
  137:    2000000n,
  56:      500000n,
  100:     300000n,
  59144:   300000n,
  81457:   300000n,
  34443:   300000n,
  1868:    300000n,
  324:     500000n,
  80094:   300000n,
  130:     200000n,
  480:     200000n,
  1135:    200000n,
  60808:   200000n,
  7777777: 200000n,
};
const DEFAULT_GAS = 300000n;
const getFallbackGas = (chainId: number) => GAS_FALLBACK[chainId] ?? DEFAULT_GAS;

// ─── Nonce error detection ────────────────────────────────────────────────────
function isNonceError(e: any): boolean {
  const msg = (e?.shortMessage || e?.message || '').toLowerCase();
  return (
    msg.includes('nonce too low') ||
    msg.includes('nonce already used') ||
    msg.includes('replacement transaction') ||
    msg.includes('already known')
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit по IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before trying again.' },
        { status: 429 },
      );
    }

    // 2. Парсинг тела
    const body: RevokeBody = await request.json();
    const { address, authorization, chainId } = body;

    if (!address || !authorization || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: address, authorization, chainId' },
        { status: 400 },
      );
    }

    // 3. Валидация адреса
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }

    // 4. Sponsor key
    const sponsorPk = process.env.SPONSOR_PRIVATE_KEY?.trim();
    if (!sponsorPk || sponsorPk === '0x...') {
      return NextResponse.json(
        { error: 'SPONSOR_PRIVATE_KEY not configured on server' },
        { status: 500 },
      );
    }

    // 5. Chain
    const chain = getChainById(chainId);
    if (!chain) {
      return NextResponse.json({ error: `Unsupported chain ID: ${chainId}` }, { status: 400 });
    }

    // 6. Верификация подписи
    try {
      const recovered = await recoverAuthorizationAddress({
        authorization: {
          chainId: authorization.chainId,
          address: authorization.address,
          nonce: authorization.nonce,
          r: authorization.r,
          s: authorization.s,
          yParity: authorization.yParity,
        },
      });
      if (recovered.toLowerCase() !== address.toLowerCase()) {
        return NextResponse.json(
          { error: 'Signature verification failed: recovered address does not match' },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Signature verification failed: invalid authorization' },
        { status: 400 },
      );
    }

    // 7. Clients
    const sponsorAccount = privateKeyToAccount(sponsorPk as `0x${string}`);
    const rpcUrl = chain.rpcUrls.default.http[0];

    const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
    const walletClient = createWalletClient({
      account: sponsorAccount,
      chain,
      transport: http(rpcUrl),
    });

    // 8. Gas estimation via viem
    let gas = getFallbackGas(chainId);
    try {
      const estimate = await publicClient.estimateGas({
        account: sponsorAccount.address,
        to: address,
        authorizationList: [authorization],
      });
      gas = (estimate * 120n) / 100n;
    } catch (e) {
      console.warn('[revoke] gas estimation failed, using fallback', e);
    }

    // 9. Fee estimation via viem
    let maxFeePerGas = 3000000000n;
    let maxPriorityFeePerGas = 1000000000n;
    try {
      const feeHistory = await publicClient.getFeeHistory({
        blockCount: 1,
        rewardPercentiles: [25],
      });
      if (feeHistory.baseFeePerGas?.length) {
        const baseFee = feeHistory.baseFeePerGas[0];
        const priority = feeHistory.reward?.[0]?.[0] ?? 1000000000n;
        maxFeePerGas = baseFee * 2n + priority;
        maxPriorityFeePerGas = priority;
      }
    } catch (e) {
      console.warn('[revoke] fee estimation failed, using defaults', e);
    }

    // Polygon минимальный priority fee
    if (chainId === 137) {
      const minPriority = 30000000000n;
      if (maxPriorityFeePerGas < minPriority) {
        maxPriorityFeePerGas = minPriority;
        maxFeePerGas = maxFeePerGas + minPriority;
      }
    }

    // 10. Проверка баланса спонсора
    try {
      const balance = await publicClient.getBalance({ address: sponsorAccount.address });
      const gasCost = gas * maxFeePerGas;
      if (balance < gasCost * 2n) {
        const needed = formatEther(gasCost);
        const has = formatEther(balance);
        return NextResponse.json(
          {
            error:
              `Sponsor wallet is low on funds on ${chain.name}. ` +
              `Has: ${Number(has).toFixed(6)} ${chain.nativeCurrency.symbol}, ` +
              `need: ~${Number(needed).toFixed(6)} ${chain.nativeCurrency.symbol}. ` +
              `Please send a small amount to the sponsor address.`,
          },
          { status: 402 },
        );
      }
    } catch { /* не блокируем если RPC не ответил */ }

    console.log('[revoke] sending', {
      chainId,
      address,
      gas: gas.toString(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    });

    // 11. Отправка с retry при nonce ошибке
    const MAX_RETRIES = 3;
    let lastError: any = null;
    let txHash: string | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        txHash = await walletClient.sendTransaction({
          to: address,
          authorizationList: [authorization],
          gas,
          maxFeePerGas,
          maxPriorityFeePerGas,
        });
        lastError = null;
        break;
      } catch (e: any) {
        lastError = e;
        if (isNonceError(e) && attempt < MAX_RETRIES) {
          console.log(`[revoke] nonce error on attempt ${attempt}, retrying...`);
          await new Promise(r => setTimeout(r, 500 * attempt));
          continue;
        }
        break;
      }
    }

    if (!txHash) {
      const msg = lastError?.shortMessage || lastError?.message || 'Unknown error';
      return NextResponse.json({ error: `sendTransaction: ${msg}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      txHash,
      explorerUrl: chain.blockExplorers?.default?.url
        ? `${chain.blockExplorers.default.url}/tx/${txHash}`
        : null,
    });
  } catch (e: any) {
    const msg = e?.shortMessage || e?.message || 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
