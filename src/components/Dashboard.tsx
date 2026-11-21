import React, { useState, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { AccountCard } from './AccountCard';
import { parseInputLine } from '../services/totp';
import jsQR from 'jsqr';
import { ShieldCheck, Upload, KeyRound, AlertCircle, CheckCircle2, ChevronUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    data,
    deleteAccount,
    addAccount,
  } = useVault();

  // State untuk menampilkan / menyembunyikan form
  const [showSecretForm, setShowSecretForm] = useState(false);

  // Input states
  const [label, setLabel] = useState('');
  const [issuer, setIssuer] = useState('');
  const [secret, setSecret] = useState('');

  // Status/Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const errorTimeoutRef = useRef<any>(null);
  const successTimeoutRef = useRef<any>(null);

  const showTempError = (msg: string) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setError(msg);
    errorTimeoutRef.current = setTimeout(() => {
      setError(null);
    }, 3000);
  };

  const showTempSuccess = (msg: string) => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setSuccessMsg(msg);
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);
  };

  const qrFileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setLabel('');
    setIssuer('');
    setSecret('');
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) {
      showTempError('Secret Key 2FA harus diisi.');
      return;
    }

    try {
      let finalData;
      if (/^otpauth:\/\//i.test(secret.trim())) {
        finalData = parseInputLine(secret.trim());
      } else {
        finalData = {
          label: label.trim() || 'Akun Baru',
          issuer: issuer.trim() || undefined,
          secret: secret.trim(),
          digits: 6,
          period: 30,
          algorithm: 'SHA-1',
        };
      }
      await addAccount(finalData as any);
      showTempSuccess('Akun 2FA berhasil ditambahkan!');
      resetForm();
      setShowSecretForm(false);
    } catch (err: any) {
      showTempError(err?.message || 'Gagal menambahkan akun.');
    }
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          try {
            const parsed = parseInputLine(code.data);
            await addAccount(parsed as any);
            showTempSuccess(`QR Terbaca: Akun "${parsed.label}" ditambahkan!`);
            setShowSecretForm(false);
          } catch (err: any) {
            showTempError(err?.message || 'Format kode QR tidak valid.');
          }
        } else {
          showTempError('Tidak menemukan kode QR yang terbaca pada gambar ini. Coba gambar yang lebih jelas.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#020617] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar Compact */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/10">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="font-extrabold tracking-tight text-white text-base">
              Winter 2FA - TOTP
            </h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-5 space-y-4">
        {/* Feedback messages */}
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-pre-line">{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 2 Tombol: Isi Secret / Upload QR */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSecretForm(!showSecretForm)}
            className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
              showSecretForm
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Isi Secret</span>
            {showSecretForm && <ChevronUp className="w-3.5 h-3.5 text-slate-300 ml-auto" />}
          </button>

          <button
            onClick={() => qrFileInputRef.current?.click()}
            className="flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition cursor-pointer active:scale-95 shadow-sm"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Upload QR</span>
          </button>

          <input
            ref={qrFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleQrFileUpload}
            className="hidden"
          />
        </div>

        {/* Form Isi Secret (Disembunyikan secara default, muncul jika tombol Isi Secret diklik) */}
        {showSecretForm && (
          <section className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md shadow-lg shadow-indigo-950/20 animate-in fade-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleManualSubmit} className="space-y-2.5">
              {/* Baris 1: Name Account dan Platform Kanan Kiri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Name Account"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  autoFocus
                />
                <input
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="Platform"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              {/* Baris 2: Secret Key dan Add 2FA bagi 2 sejajar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Secret Key"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder-slate-500 normal-case"
                />

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center"
                >
                  + 2FA
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Daftar Kartu 2FA Compact Grid */}
        {data.accounts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                onDelete={deleteAccount}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
