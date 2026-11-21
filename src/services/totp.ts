import * as OTPAuth from 'otpauth';
import { OtpAccount } from '../types';

export function normalizeSecret(secret: string): string {
  return secret.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
}

export function parseOtpauthUri(uri: string): Partial<OtpAccount> {
  const parsed = OTPAuth.URI.parse(uri);
  if (!(parsed instanceof OTPAuth.TOTP)) {
    throw new Error('Hanya format TOTP yang didukung (HOTP tidak didukung).');
  }

  const label = parsed.label || '';
  const issuer = parsed.issuer || '';
  let cleanLabel = label;
  if (issuer && label.startsWith(issuer + ':')) {
    cleanLabel = label.slice(issuer.length + 1).trim();
  }

  return {
    label: cleanLabel || issuer || 'Akun Tanpa Nama',
    issuer: issuer || undefined,
    secret: parsed.secret.base32,
    digits: parsed.digits || 6,
    period: parsed.period || 30,
    algorithm: (parsed.algorithm === 'SHA256' ? 'SHA-256' : parsed.algorithm === 'SHA512' ? 'SHA-512' : 'SHA-1') as any,
  };
}

export function parseInputLine(line: string): Partial<OtpAccount> {
  const trimmed = line.trim();
  if (/^otpauth:\/\//i.test(trimmed)) {
    return parseOtpauthUri(trimmed);
  }

  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((s) => s.trim());
    let secretPart = '';
    let labelPart = '';
    for (const p of parts) {
      const clean = normalizeSecret(p);
      if (/^[A-Z2-7]{10,}$/.test(clean)) {
        secretPart = clean;
      } else if (!/^\d{6,8}$/.test(p)) {
        labelPart = p;
      }
    }
    if (secretPart) {
      return {
        label: labelPart || 'Akun',
        secret: secretPart,
        digits: 6,
        period: 30,
        algorithm: 'SHA-1',
      };
    }
  }

  const kv = trimmed.match(/^(.{1,48}?)\s*[:=]\s*([A-Za-z2-7\s-]{6,})$/);
  if (kv) {
    const cleanSecret = normalizeSecret(kv[2]);
    if (/^[A-Z2-7]{6,}$/.test(cleanSecret)) {
      return {
        label: kv[1].trim(),
        secret: cleanSecret,
        digits: 6,
        period: 30,
        algorithm: 'SHA-1',
      };
    }
  }

  const clean = normalizeSecret(trimmed);
  if (/^[A-Z2-7]{6,}$/.test(clean)) {
    return {
      label: 'Akun Baru',
      secret: clean,
      digits: 6,
      period: 30,
      algorithm: 'SHA-1',
    };
  }

  throw new Error(`Format tidak dikenali: "${trimmed.slice(0, 30)}..."`);
}

export function generateTotpCode(
  account: OtpAccount,
  timestamp = Date.now()
): { code: string; nextCode: string; remaining: number } {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: account.issuer,
      label: account.label,
      algorithm: account.algorithm.replace('-', '') as any,
      digits: account.digits || 6,
      period: account.period || 30,
      secret: OTPAuth.Secret.fromBase32(account.secret),
    });

    const code = totp.generate({ timestamp });
    const period = account.period || 30;
    const remaining = period - (Math.floor(timestamp / 1000) % period);

    // Compute next code for timestamp + remaining seconds
    const nextCode = totp.generate({ timestamp: timestamp + remaining * 1000 + 1000 });

    return { code, nextCode, remaining };
  } catch (err) {
    console.error('Error generating TOTP:', err);
    return { code: '------', nextCode: '------', remaining: 0 };
  }
}

export function toOtpauthString(account: OtpAccount): string {
  const totp = new OTPAuth.TOTP({
    issuer: account.issuer || (account.label.includes('—') ? account.label.split('—')[0].trim() : undefined),
    label: account.label,
    algorithm: account.algorithm.replace('-', '') as any,
    digits: account.digits || 6,
    period: account.period || 30,
    secret: OTPAuth.Secret.fromBase32(account.secret),
  });

  return totp.toString();
}
