import React, { useState, useEffect } from 'react';
import { OtpAccount } from '../types';
import { generateTotpCode } from '../services/totp';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Copy, Check, Trash2 } from 'lucide-react';

interface AccountCardProps {
  account: OtpAccount;
  onDelete: (id: string) => void;
}

// Convert string to Upper CamelCase
function toUpperCamelCase(text: string): string {
  if (!text) return '';
  return text
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onDelete }) => {
  const [totp, setTotp] = useState<{ code: string; nextCode: string; remaining: number }>({
    code: '------',
    nextCode: '------',
    remaining: 30,
  });
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const update = () => {
      setTotp(generateTotpCode(account));
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [account]);

  const handleCopy = () => {
    if (totp.code && totp.code !== '------') {
      navigator.clipboard.writeText(totp.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isExpiring = totp.remaining <= 5;
  const progressPercent = (totp.remaining / (account.period || 30)) * 100;

  const formatCode = (codeStr: string) => {
    if (codeStr.length === 6) {
      return `${codeStr.slice(0, 3)} ${codeStr.slice(3)}`;
    }
    if (codeStr.length === 8) {
      return `${codeStr.slice(0, 4)} ${codeStr.slice(4)}`;
    }
    return codeStr;
  };

  const formattedCode = formatCode(totp.code);
  const formattedNextCode = formatCode(totp.nextCode);

  // Format "Layanan - Akun/Email" atau sebaliknya dengan Upper CamelCase
  let titleStr = '';
  if (account.issuer && account.label && account.issuer.toLowerCase() !== account.label.toLowerCase()) {
    titleStr = `${toUpperCamelCase(account.issuer)} - ${account.label}`;
  } else {
    titleStr = toUpperCamelCase(account.issuer || account.label || 'Akun');
  }

  return (
    <>
      <div
        className={`group relative bg-gradient-to-b from-slate-900/90 to-slate-900/60 hover:from-slate-850 hover:to-slate-900/90 border transition-all duration-200 rounded-xl p-3 sm:p-3.5 shadow-md backdrop-blur-md flex flex-col justify-between ${
          isExpiring
            ? 'border-amber-500/50 shadow-amber-500/10'
            : 'border-slate-800/80 hover:border-indigo-500/40 hover:shadow-indigo-500/10'
        }`}
      >
        <div>
          {/* Baris 1: Judul "Layanan - Akun" & Tombol Hapus */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-white truncate text-xs sm:text-sm leading-tight tracking-wide">
              {titleStr}
            </h3>

            <button
              onClick={() => setShowDeleteModal(true)}
              title="Hapus Akun"
              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 rounded-lg transition-all cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Baris 2: Angka 2FA BESAR + "next Angka" di sampingnya + Tombol "Salin Kode" dinaikkan ke atas bar */}
          <div className="flex items-center justify-between gap-2 my-1">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span
                onClick={handleCopy}
                className="font-mono text-2xl sm:text-3xl font-extrabold tracking-wider select-all cursor-pointer text-amber-400 hover:text-amber-300 transition-colors leading-none"
              >
                {formattedCode}
              </span>

              {/* next Angka di samping angka 2FA */}
              <span className="text-[11px] sm:text-xs text-slate-400 font-mono tracking-tight whitespace-nowrap">
                next <b className="text-slate-300 font-normal">{formattedNextCode}</b>
              </span>
            </div>

            {/* Tombol Salin Kode dinaikkan ke atas bar */}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer active:scale-95 flex-shrink-0 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700/60 shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Bar di paling bawah kartu */}
          <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden mt-2 mb-0.5">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isExpiring
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Hapus Akun 2FA?"
        description={`Yakin ingin menghapus akun "${titleStr}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={() => {
          setShowDeleteModal(false);
          onDelete(account.id);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};
