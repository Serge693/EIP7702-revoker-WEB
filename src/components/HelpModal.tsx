'use client';

import { useState } from 'react';

const SPONSOR_ADDRESS = '0x3F7Bd7b07A47071D824795F9CB2AcB28395056dA';

type Lang = 'ru' | 'en';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-xs text-blue-400 hover:text-blue-300 transition-colors ml-2 shrink-0"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function SponsorBlock({ lang }: { lang: Lang }) {
  return (
    <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-2">
      <p className="text-sm font-medium text-white">
        {lang === 'ru' ? '💜 Поддержать проект' : '💜 Support the project'}
      </p>
      <p className="text-xs text-zinc-400 leading-relaxed">
        {lang === 'ru'
          ? 'Отзыв делегации полностью бесплатен — газ оплачивает спонсорский кошелёк. Если приложение вам помогло, вы можете поддержать проект, отправив любую сумму на адрес спонсора в любой сети.'
          : 'Revocation is completely free — gas is paid by the sponsor wallet. If this tool helped you, consider sending any amount to the sponsor address on any network.'}
      </p>
      <p className="text-xs text-zinc-500">
        {lang === 'ru'
          ? 'Если транзакция завершается ошибкой — вероятно, на спонсорском кошельке закончился газ в этой сети. Переведите 2–3 цента (в Ethereum ~$1–2) на адрес ниже в нужной сети:'
          : 'If a transaction fails — the sponsor wallet may be out of gas on that network. Send $0.02–0.03 (on Ethereum ~$1–2) to the address below on the required network:'}
      </p>
      <div className="flex items-center bg-zinc-900 rounded-lg px-3 py-2 gap-2">
        <span className="font-mono text-xs text-zinc-300 break-all">{SPONSOR_ADDRESS}</span>
        <CopyButton text={SPONSOR_ADDRESS} />
      </div>
      <a
        href={`https://etherscan.io/address/${SPONSOR_ADDRESS}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-400 hover:text-blue-300 underline block"
      >
        {lang === 'ru' ? 'Посмотреть на Etherscan →' : 'View on Etherscan →'}
      </a>
      <div className="border-t border-zinc-700 pt-3 mt-1 flex items-center gap-2">
        <span className="text-xs text-zinc-500">
          {lang === 'ru' ? 'Вопросы и обратная связь:' : 'Questions & feedback:'}
        </span>
        <a
          href="https://t.me/Sergio6967"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#229ED9] hover:text-[#1a8bbf] font-medium transition-colors"
        >
          @Sergio6967
        </a>
      </div>
    </div>
  );
}

type Section = {
  icon: string;
  titleRu: string;
  titleEn: string;
  contentRu: React.ReactNode;
  contentEn: React.ReactNode;
};

function Accordion({ sections, lang }: { sections: Section[]; lang: Lang }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-1">
      {sections.map((s, i) => (
        <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/40 transition-colors"
          >
            <span className="text-base">{s.icon}</span>
            <span className="text-sm font-medium flex-1">
              {lang === 'ru' ? s.titleRu : s.titleEn}
            </span>
            <span className={`text-zinc-500 text-xs transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {open === i && (
            <div className="px-4 pb-4 pt-1 text-sm text-zinc-300 leading-relaxed space-y-3">
              {lang === 'ru' ? s.contentRu : s.contentEn}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const Step = ({ n, children }: { n: number | string; children: React.ReactNode }) => (
  <div className="flex gap-3 items-start">
    <div className="min-w-[24px] h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400 font-medium mt-0.5">
      {n}
    </div>
    <div className="text-sm text-zinc-300 leading-relaxed">{children}</div>
  </div>
);

const Note = ({ children, variant = 'warn' }: { children: React.ReactNode; variant?: 'warn' | 'info' | 'ok' }) => {
  const styles = {
    warn: 'border-yellow-700/50 bg-yellow-900/20 text-yellow-300',
    info: 'border-blue-700/50 bg-blue-900/20 text-blue-300',
    ok: 'border-green-700/50 bg-green-900/20 text-green-300',
  };
  return (
    <div className={`border-l-2 rounded-r-lg px-3 py-2 text-xs leading-relaxed ${styles[variant]}`}>
      {children}
    </div>
  );
};

const sections: Section[] = [
  {
    icon: '🔍',
    titleRu: 'Что делает приложение',
    titleEn: 'What this app does',
    contentRu: (
      <>
        <p>EIP-7702 Revoker позволяет отозвать делегирование вашего кошелька — ситуацию, когда злоумышленник привязал к вашему EOA вредоносный смарт-контракт через EIP-7702.</p>
        <Note variant="info">Газ за транзакцию платит спонсорский кошелёк — ETH на скомпрометированном кошельке не нужен.</Note>
        <Note variant="warn">Приложение <strong>не возвращает украденные средства</strong>. После отзыва немедленно переведите активы на новый кошелёк.</Note>
      </>
    ),
    contentEn: (
      <>
        <p>EIP-7702 Revoker lets you remove an unwanted EIP-7702 delegation — a situation where an attacker linked a malicious smart contract to your EOA.</p>
        <Note variant="info">Gas is paid by the sponsor wallet — you don't need any ETH on the compromised account.</Note>
        <Note variant="warn">This tool <strong>does not recover stolen funds</strong>. After revoking, move all assets to a new wallet immediately.</Note>
      </>
    ),
  },
  {
    icon: '📋',
    titleRu: 'Как пользоваться',
    titleEn: 'How to use',
    contentRu: (
      <div className="space-y-3">
        <Step n={1}>Нажмите <strong>Connect Wallet</strong> и подключите <strong>скомпрометированный кошелёк</strong>. Используется только для получения адреса — приватный ключ не нужен.</Step>
        <Step n={2}>Приложение автоматически сканирует <strong>18 сетей</strong>. Жёлтая точка — найдено делегирование, зелёная — чисто.</Step>
        <Step n={3}>Введите <strong>приватный ключ скомпрометированного кошелька</strong> в поле ввода. Ключ используется только локально в браузере и стирается из памяти сразу после подписи.</Step>
        <Step n={4}>Нажмите <strong>Revoke</strong> рядом с нужной сетью или <strong>Revoke All</strong> для всех сетей сразу.</Step>
        <Step n={5}>Дождитесь подтверждения — появится ссылка на транзакцию в обозревателе блоков.</Step>
      </div>
    ),
    contentEn: (
      <div className="space-y-3">
        <Step n={1}>Click <strong>Connect Wallet</strong> and connect the <strong>compromised wallet</strong>. Used only to read your address — no private key needed at this step.</Step>
        <Step n={2}>The app scans <strong>18 networks simultaneously</strong>. Yellow dot = active delegation found. Green = clean.</Step>
        <Step n={3}>Enter the <strong>private key of the compromised wallet</strong>. It is used only locally in your browser and is wiped from memory immediately after signing.</Step>
        <Step n={4}>Click <strong>Revoke</strong> next to a network, or <strong>Revoke All</strong> to clear all delegations in sequence.</Step>
        <Step n={5}>Wait for confirmation — an explorer link will appear on success.</Step>
      </div>
    ),
  },
  {
    icon: '🔗',
    titleRu: 'Вкладка Delegate',
    titleEn: 'Delegate tab',
    contentRu: (
      <>
        <p>Вкладка <strong>Delegate</strong> позволяет установить новое делегирование — передать управление EOA доверенному смарт-контракту (мультисиг, смарт-аккаунт и т.д.).</p>
        <Note variant="warn">Делегирование даёт контракту <strong>полный контроль</strong> над вашим EOA. Используйте только для проверенных контрактов.</Note>
      </>
    ),
    contentEn: (
      <>
        <p>The <strong>Delegate</strong> tab lets you set a new delegation — hand control of your EOA to a trusted smart contract (multisig, smart account, etc.).</p>
        <Note variant="warn">Delegating gives the contract <strong>full control</strong> over your EOA. Only use with contracts you fully trust.</Note>
      </>
    ),
  },
  {
    icon: '🔒',
    titleRu: 'Безопасность',
    titleEn: 'Security',
    contentRu: (
      <div className="space-y-3">
        <Step n="🔑">
          <strong>Приватный ключ не покидает браузер.</strong> Подпись создаётся локально через <code className="bg-zinc-800 px-1 rounded text-xs">viem/accounts</code>. На сервер уходит только кортеж <code className="bg-zinc-800 px-1 rounded text-xs">{'{r, s, yParity}'}</code>.
        </Step>
        <Step n="🗑">
          Ключ стирается из состояния React <strong>сразу после подписи</strong>, до отправки запроса на сервер.
        </Step>
        <Step n="🖥">
          Спонсор-сервер видит метаданные транзакции, но <strong>не может изменить подписанную авторизацию</strong> — она криптографически привязана к адресу и нонсу.
        </Step>
        <Note variant="ok">После отзыва делегирования <strong>переведите все активы</strong> на новый кошелёк — скомпрометированный ключ по-прежнему у злоумышленника.</Note>
      </div>
    ),
    contentEn: (
      <div className="space-y-3">
        <Step n="🔑">
          <strong>Your private key never leaves the browser.</strong> The signature is created locally via <code className="bg-zinc-800 px-1 rounded text-xs">viem/accounts</code>. Only <code className="bg-zinc-800 px-1 rounded text-xs">{'{r, s, yParity}'}</code> is sent to the server.
        </Step>
        <Step n="🗑">
          The key is cleared from React state <strong>immediately after signing</strong>, before the server request is made.
        </Step>
        <Step n="🖥">
          The sponsor server sees transaction metadata but <strong>cannot alter the signed authorization</strong> — it is cryptographically bound to the exact address and nonce.
        </Step>
        <Note variant="ok">After revoking, <strong>move all assets</strong> to a new wallet — the compromised private key is still in the attacker's hands.</Note>
      </div>
    ),
  },
  {
    icon: '❓',
    titleRu: 'Частые вопросы',
    titleEn: 'FAQ',
    contentRu: (
      <div className="space-y-4">
        {[
          ['Нужен ли ETH на скомпрометированном кошельке?', 'Нет. Газ оплачивает спонсорский кошелёк. Ваш баланс не расходуется.'],
          ['Мой кошелёк не поддерживает EIP-7702 подпись — что делать?', 'Именно поэтому есть поле ввода приватного ключа. Подпись создаётся через viem прямо в браузере, без участия расширения кошелька.'],
          ['Почему zkSync Era помечена предупреждением?', 'zkSync Era имеет нестандартную VM и может не поддерживать EIP-7702. Транзакция может завершиться ошибкой.'],
          ['Что значит «делегирование к 0x0000…0000»?', 'Это стандартный способ отзыва EIP-7702. Нулевой адрес означает «нет делегирования» — кошелёк возвращается к обычному EOA.'],
          ['Сканирование не нашло делегирований — я в безопасности?', 'Не обязательно. Если ключ скомпрометирован, средства могут выводиться напрямую. Переведите активы на новый кошелёк в любом случае.'],
        ].map(([q, a]) => (
          <div key={q}>
            <p className="text-white text-sm font-medium mb-1">{q}</p>
            <p className="text-zinc-400 text-xs leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    ),
    contentEn: (
      <div className="space-y-4">
        {[
          ['Do I need ETH on the compromised wallet?', 'No. Gas is paid by the sponsor wallet. Your balance is not touched.'],
          ["My wallet doesn't support EIP-7702 signing — what now?", 'That\'s why the private key input exists. The signature is created by viem directly in your browser, without any wallet extension.'],
          ['Why is zkSync Era marked with a warning?', 'zkSync Era uses a non-standard VM and may not fully support EIP-7702. The transaction may fail on that network.'],
          ['What does "delegating to 0x0000…0000" mean?', 'The zero address is the standard EIP-7702 revocation target. It signals "no delegation" — the wallet returns to normal EOA behaviour.'],
          ['The scan found no delegations — am I safe?', "Not necessarily. If your key is compromised, an attacker can drain funds directly without any delegation. Move assets to a new wallet regardless."],
        ].map(([q, a]) => (
          <div key={q}>
            <p className="text-white text-sm font-medium mb-1">{q}</p>
            <p className="text-zinc-400 text-xs leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    ),
  },
];

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

export default function HelpModal() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('ru');

  return (
    <>
      {/* Кнопки в правом нижнем углу */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-40">
        {/* Telegram */}
        <a
          href="https://t.me/Sergio6967"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-[#229ED9] hover:bg-[#1a8bbf] text-white flex items-center justify-center shadow-lg transition-colors"
          aria-label="Feedback via Telegram"
          title="Feedback"
        >
          <TelegramIcon />
        </a>
        {/* Help */}
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-bold text-lg flex items-center justify-center shadow-lg transition-colors"
          aria-label="Help"
          title="Help"
        >
          ?
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          {/* Modal */}
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col z-50"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
              <h2 className="font-semibold text-base">
                {lang === 'ru' ? 'Справка' : 'Help'}
              </h2>
              <div className="flex items-center gap-3">
                {/* Lang toggle */}
                <div className="flex bg-zinc-900 rounded-lg p-0.5 text-xs">
                  {(['ru', 'en'] as Lang[]).map(l => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-3 py-1 rounded-md transition-colors font-medium ${
                        lang === l ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {l === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              <Accordion sections={sections} lang={lang} />
              <SponsorBlock lang={lang} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
