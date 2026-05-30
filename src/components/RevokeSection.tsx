'use client';

import { useState, useEffect } from 'react';
import { zeroAddress } from 'viem';
import { supportedChains, getChainById, getChainWarning } from '@/utils/networks';
import { signAuthorizationWithPrivateKey } from '@/utils/sign';

const SPONSOR_ADDRESS = '0x3F7Bd7b07A47071D824795F9CB2AcB28395056dA';

type Step = 'idle' | 'signing' | 'sending' | 'done';
type RevokeProgress = { current: number; total: number; chainName: string; done: ChainResult[] } | null;
type ChainResult = { chainName: string; txHash: string; explorerUrl: string | null };
type Tab = 'revoke' | 'delegate';
type Props = { address: `0x${string}` };

function formatError(raw: string, chainId: number | null): React.ReactNode {
  const msg = raw.toLowerCase();
  const isInsufficientFunds =
    msg.includes('insufficient funds') ||
    msg.includes('insufficient balance') ||
    msg.includes('gas required exceeds') ||
    msg.includes('intrinsic gas');

  if (isInsufficientFunds) {
    const chainName = chainId ? getChainById(chainId)?.name ?? `Chain ${chainId}` : 'this network';
    return (
      <span>
        ⛽ The sponsor wallet is out of gas on <strong>{chainName}</strong>.
        Please send $0.02–0.03 (on Ethereum ~$1–2) to the sponsor address on {chainName}:{' '}
        <span className="font-mono text-xs bg-red-900/40 px-1 rounded break-all">{SPONSOR_ADDRESS}</span>
      </span>
    );
  }

  return <span>❌ {raw}</span>;
}

function StatusDot({ status }: { status: ChainStatus['status'] }) {
  if (status === 'checking') return <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />;
  if (status === 'delegated') return <div className="w-2 h-2 rounded-full bg-yellow-400" />;
  if (status === 'clean') return <div className="w-2 h-2 rounded-full bg-green-500" />;
  return <div className="w-2 h-2 rounded-full bg-zinc-600" />;
}

function TxSuccess({ txHash, label, explorerUrl }: { txHash: string; label: string; explorerUrl: string | null }) {
  return (
    <div className="bg-green-900/30 border border-green-700 p-4 rounded-xl space-y-2">
      <p className="text-green-400 font-medium">{label}</p>
      <p className="font-mono text-xs break-all text-gray-300">{txHash}</p>
      {explorerUrl && (
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-sm underline block">
          View in Explorer →
        </a>
      )}
    </div>
  );
}

export default function RevokeSection({ address }: Props) {
  const [tab, setTab] = useState<Tab>('revoke');
  const [step, setStep] = useState<Step>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  const [chainStatuses, setChainStatuses] = useState<ChainStatus[]>([]);
  const [scanning, setScanning] = useState(false);
  const [delegateTarget, setDelegateTarget] = useState('');
  const [delegateChainId, setDelegateChainId] = useState(1);
  const [privateKey, setPrivateKey] = useState('');
  const [pkAddress, setPkAddress] = useState<string | null>(null);
  const [pkError, setPkError] = useState<string | null>(null);
  const [revokingChainId, setRevokingChainId] = useState<number | null>(null);
  const [revokeProgress, setRevokeProgress] = useState<RevokeProgress>(null);

  const delegateChain = getChainById(delegateChainId);
  const isLoading = step === 'signing' || step === 'sending';
  const canProceed = !!pkAddress;

  useEffect(() => { if (address) runScan(); }, [address]);

  const recheckChain = async (chainId: number) => {
    setChainStatuses(prev =>
      prev.map(s => s.chainId === chainId ? { ...s, status: 'checking' as const, error: undefined } : s)
    );
    const chain = supportedChains.find(c => c.id === chainId);
    if (!chain) return;
    try {
      const res = await fetch(`/api/delegation?address=${address}&chainId=${chainId}`);
      const data = await res.json();
      setChainStatuses(prev =>
        prev.map(s => s.chainId === chainId
          ? { ...s, status: (data.error ? 'error' : data.delegated ? 'delegated' : 'clean') as ChainStatus['status'], delegateTo: data.delegateTo, error: data.error }
          : s
        )
      );
    } catch (e: any) {
      setChainStatuses(prev =>
        prev.map(s => s.chainId === chainId ? { ...s, status: 'error' as const, error: e.message } : s)
      );
    }
  };

  const runScan = async () => {
    setScanning(true);
    setSelectedChainId(null);
    setTxHash(null);
    setError(null);
    setChainStatuses(
      supportedChains.map(c => ({ chainId: c.id, chainName: c.name, status: 'checking' as const }))
    );
    await Promise.all(
      supportedChains.map(async (chain) => {
        try {
          const res = await fetch(`/api/delegation?address=${address}&chainId=${chain.id}`);
          const data = await res.json();
          setChainStatuses(prev =>
            prev.map(s => s.chainId === chain.id
              ? { ...s, status: (data.error ? 'error' : data.delegated ? 'delegated' : 'clean') as ChainStatus['status'], delegateTo: data.delegateTo, error: data.error }
              : s
            )
          );
        } catch (e: any) {
          setChainStatuses(prev =>
            prev.map(s => s.chainId === chain.id ? { ...s, status: 'error' as const, error: e.message } : s)
          );
        }
      })
    );
    setScanning(false);
  };

  const handlePrivateKeyChange = async (pk: string) => {
    setPrivateKey(pk);
    setPkError(null);
    setPkAddress(null);
    if (!pk.trim()) return;
    try {
      const { privateKeyToAccount } = await import('viem/accounts');
      const pkClean = pk.trim().startsWith('0x')
        ? pk.trim() as `0x${string}`
        : `0x${pk.trim()}` as `0x${string}`;
      if (pkClean.length !== 66) { setPkError('Invalid private key length'); return; }
      const acc = privateKeyToAccount(pkClean);
      setPkAddress(acc.address);
    } catch { setPkError('Invalid private key'); }
  };

  const getNonce = async (chainId: number): Promise<number> => {
    const chain = getChainById(chainId);
    const res = await fetch(chain!.rpcUrls.default.http[0], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [address, 'pending'], id: 1 }),
    });
    const data = await res.json();
    return parseInt(data.result, 16);
  };

  const sendAuthorizationTx = async (chainId: number, contractAddress: `0x${string}`) => {
    if (!pkAddress) throw new Error('Enter private key of compromised wallet');

    setStep('signing');

    const pkSnapshot = privateKey.trim().startsWith('0x')
      ? privateKey.trim() as `0x${string}`
      : `0x${privateKey.trim()}` as `0x${string}`;

    const nonce = await getNonce(chainId);
    const { r, s, yParity } = await signAuthorizationWithPrivateKey(pkSnapshot, chainId, contractAddress, nonce);

    setPrivateKey('');
    setPkAddress(null);

    setStep('sending');

    const res = await fetch('/api/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        chainId,
        authorization: { chainId, address: contractAddress, nonce, r, s, yParity },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
    return data.txHash as string;
  };

  const handleRevokeChain = async (chainId: number) => {
    setError(null);
    setTxHash(null);
    setRevokingChainId(chainId);
    setSelectedChainId(chainId);
    try {
      const warning = getChainWarning(chainId);
      if (warning && !confirm(warning + '\n\nContinue?')) {
        setRevokingChainId(null);
        setStep('idle');
        return;
      }
      const hash = await sendAuthorizationTx(chainId, zeroAddress);
      setTxHash(hash);
      setStep('done');
      setChainStatuses(prev =>
        prev.map(s => s.chainId === chainId ? { ...s, status: 'clean' as const, delegateTo: null } : s)
      );
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || 'Unknown error');
      setStep('idle');
    } finally {
      setRevokingChainId(null);
    }
  };

  const handleDelegate = async () => {
    setError(null);
    setTxHash(null);
    const target = delegateTarget.trim() as `0x${string}`;
    if (!target.startsWith('0x') || target.length !== 42) { setError('Invalid contract address'); return; }
    try {
      const hash = await sendAuthorizationTx(delegateChainId, target);
      setTxHash(hash);
      setStep('done');
      setChainStatuses(prev =>
        prev.map(s => s.chainId === delegateChainId ? { ...s, status: 'delegated' as const, delegateTo: target } : s)
      );
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || 'Unknown error');
      setStep('idle');
    }
  };

  const getExplorerUrl = (chainId: number | null, hash: string | null): string | null => {
    if (!hash || !chainId) return null;
    const chain = getChainById(chainId);
    const base = chain?.blockExplorers?.default?.url;
    return base ? base + '/tx/' + hash : null;
  };

  const delegatedChains = chainStatuses.filter(s => s.status === 'delegated');
  const currentExplorerUrl = getExplorerUrl(selectedChainId, txHash);

  return (
    <div className="space-y-5">

      {/* Scan table — 2 колонки */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-semibold text-lg">Delegation Scan</h2>
          <button onClick={runScan} disabled={scanning}
            className="text-sm text-blue-400 hover:text-blue-300 disabled:text-zinc-500 transition-colors">
            {scanning ? 'Scanning...' : '↻ Rescan'}
          </button>
        </div>

        <div className="grid grid-cols-2 divide-x divide-zinc-800">
          <div className="divide-y divide-zinc-800">
            {chainStatuses.filter((_, i) => i % 2 === 0).map(s => (
              <ChainRow
                key={s.chainId}
                s={s}
                isRevoking={revokingChainId === s.chainId}
                canRevoke={canProceed && !isLoading}
                onRevoke={() => handleRevokeChain(s.chainId)}
                onRetry={() => recheckChain(s.chainId)}
              />
            ))}
          </div>
          <div className="divide-y divide-zinc-800">
            {chainStatuses.filter((_, i) => i % 2 === 1).map(s => (
              <ChainRow
                key={s.chainId}
                s={s}
                isRevoking={revokingChainId === s.chainId}
                canRevoke={canProceed && !isLoading}
                onRevoke={() => handleRevokeChain(s.chainId)}
                onRetry={() => recheckChain(s.chainId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Private key */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className={['w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
            pkAddress ? 'bg-green-600' : 'bg-zinc-700'].join(' ')}>
            {pkAddress ? '✓' : '1'}
          </div>
          <h3 className="font-medium">Private key of compromised wallet</h3>
        </div>
        <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-3 text-orange-300 text-xs space-y-1">
          <p className="font-semibold">⚠️ Security notice</p>
          <p>Your private key is used ONLY locally in your browser to sign the EIP-7702 authorization. It is never sent to any server and is cleared from memory immediately after signing.</p>
        </div>
        <input
          type="password"
          value={privateKey}
          onChange={e => handlePrivateKeyChange(e.target.value)}
          placeholder="Private key (0x... or without prefix)"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 font-mono text-sm focus:outline-none focus:border-orange-500 placeholder-zinc-600"
        />
        {pkAddress && <p className="text-green-400 text-xs">✅ Valid — {pkAddress.slice(0, 10)}...{pkAddress.slice(-6)}</p>}
        {pkError && <p className="text-red-400 text-xs">❌ {pkError}</p>}
      </div>

      {/* Sponsor info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold">✓</div>
          <h3 className="font-medium text-sm">Gas is sponsored — no ETH needed on compromised wallet</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => { setTab('revoke'); setError(null); setTxHash(null); setStep('idle'); }}
            className={['flex-1 py-3 text-sm font-medium transition-colors',
              tab === 'revoke' ? 'text-white border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
            🚫 Revoke All
          </button>
          <button
            onClick={() => { setTab('delegate'); setError(null); setTxHash(null); setStep('idle'); }}
            className={['flex-1 py-3 text-sm font-medium transition-colors',
              tab === 'delegate' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
            🔗 Delegate
          </button>
        </div>

        <div className="p-5 space-y-4">

          {tab === 'revoke' && (
            <div className="space-y-4">
              {delegatedChains.length === 0 && !scanning ? (
                <p className="text-center text-green-400 py-4">No active delegations found</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm">
                    Found <span className="text-yellow-400 font-medium">{delegatedChains.length}</span> active delegation{delegatedChains.length !== 1 ? 's' : ''}. Click Revoke next to each network above, or use the button below to revoke all at once.
                  </p>
                  {/* Прогресс Revoke All */}
                  {revokeProgress && (
                    <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">
                          Revoking <span className="text-white font-medium">{revokeProgress.chainName}</span>...
                        </span>
                        <span className="text-zinc-500 font-mono">
                          {revokeProgress.current}/{revokeProgress.total}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${(revokeProgress.current / revokeProgress.total) * 100}%` }}
                        />
                      </div>
                      {/* Done list */}
                      {revokeProgress.done.length > 0 && (
                        <div className="space-y-1">
                          {revokeProgress.done.map(r => (
                            <div key={r.txHash} className="flex items-center justify-between text-xs">
                              <span className="text-green-400">✓ {r.chainName}</span>
                              {r.explorerUrl && (
                                <a href={r.explorerUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300">
                                  tx ↗
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      if (!pkAddress) return;
                      const chains = [...delegatedChains];
                      setRevokeProgress({ current: 1, total: chains.length, chainName: chains[0]?.chainName ?? '', done: [] });
                      const done: ChainResult[] = [];
                      for (let i = 0; i < chains.length; i++) {
                        const c = chains[i];
                        setRevokeProgress({ current: i + 1, total: chains.length, chainName: c.chainName, done: [...done] });
                        try {
                          await handleRevokeChain(c.chainId);
                          const explorerUrl = getChainById(c.chainId)?.blockExplorers?.default?.url ?? null;
                          done.push({ chainName: c.chainName, txHash: '...', explorerUrl });
                        } catch { /* handleRevokeChain уже устанавливает error */ }
                        if (!pkAddress && i < chains.length - 1) break; // ключ стёрт после первой подписи
                      }
                      setRevokeProgress(null);
                    }}
                    disabled={isLoading || !canProceed || delegatedChains.length === 0 || !!revokeProgress}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl py-4 text-lg font-bold transition-all"
                  >
                    {revokeProgress
                      ? `Revoking ${revokeProgress.current}/${revokeProgress.total}...`
                      : !pkAddress ? 'Enter private key first'
                      : `Revoke All (${delegatedChains.length})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'delegate' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-gray-400 text-sm">Contract address to delegate to</label>
                <input type="text" value={delegateTarget} onChange={e => setDelegateTarget(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 font-mono text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-gray-400 text-sm">Network</label>
                <select value={delegateChainId} onChange={e => setDelegateChainId(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                >
                  {supportedChains.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-3 text-yellow-400 text-xs">
                ⚠️ Delegating gives the contract full control over your EOA. Only delegate to contracts you trust.
              </div>
              <button onClick={handleDelegate}
                disabled={!delegateTarget || isLoading || !canProceed}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl py-4 text-lg font-bold transition-all"
              >
                {isLoading
                  ? (step === 'signing' ? 'Signing...' : 'Sending...')
                  : `Delegate on ${delegateChain?.name ?? '...'}`}
              </button>
            </div>
          )}

          {isLoading && (
            <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-xl text-sm">
              {step === 'signing' && '✍️ Signing authorization locally...'}
              {step === 'sending' && '📡 Sending transaction via sponsored server...'}
            </div>
          )}

          {txHash && (
            <TxSuccess
              txHash={txHash}
              label={tab === 'revoke' ? '✅ Delegation revoked!' : '✅ Delegation set!'}
              explorerUrl={currentExplorerUrl}
            />
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-700 p-4 rounded-xl text-red-300 text-sm leading-relaxed">
              {formatError(error, selectedChainId)}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

function ChainRow({
  s,
  isRevoking,
  canRevoke,
  onRevoke,
  onRetry,
}: {
  s: ChainStatus;
  isRevoking: boolean;
  canRevoke: boolean;
  onRevoke: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 min-h-[48px]">
      <div className="flex items-center gap-2 min-w-0">
        <StatusDot status={s.status} />
        <span className="text-xs font-medium truncate">{s.chainName}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-1">
        {s.status === 'checking' && <span className="text-xs text-zinc-500">...</span>}
        {s.status === 'clean' && <span className="text-xs text-green-500">Clean</span>}
        {s.status === 'error' && (
          <button
            onClick={onRetry}
            title={s.error ?? 'RPC error — click to retry'}
            className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors px-1"
          >
            ↻ err
          </button>
        )}
        {s.status === 'delegated' && (
          <button
            onClick={onRevoke}
            disabled={!canRevoke || isRevoking}
            className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed px-2 py-1 rounded-lg font-medium transition-all"
          >
            {isRevoking ? '...' : 'Revoke'}
          </button>
        )}
      </div>
    </div>
  );
}

type ChainStatus = {
  chainId: number;
  chainName: string;
  status: 'checking' | 'delegated' | 'clean' | 'error';
  delegateTo?: string | null;
  error?: string;
};
