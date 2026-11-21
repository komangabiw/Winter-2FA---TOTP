export interface OtpAccount {
  id: string;
  label: string;
  issuer?: string;
  secret: string; // Base32
  digits: number;
  period: number;
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512';
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  accounts: OtpAccount[];
  lastModified: number;
}
