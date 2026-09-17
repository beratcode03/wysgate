import type { VaultEntry } from '@/components/VaultProvider';

export function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 5);
}

export function passwordLabel(password: string) {
  const score = passwordScore(password);
  return score >= 4 ? 'Güçlü' : score >= 2 ? 'Orta' : 'Zayıf';
}

export function analyzeVault(entries: VaultEntry[]) {
  const weak = entries.filter((entry) => passwordScore(entry.password) < 3);
  const passwordGroups = new Map<string, VaultEntry[]>();
  entries.forEach((entry) => {
    const group = passwordGroups.get(entry.password) ?? [];
    group.push(entry);
    passwordGroups.set(entry.password, group);
  });
  const reused = Array.from(passwordGroups.values()).filter((group) => group.length > 1).flat();
  const old = entries.filter((entry) => Date.now() - new Date(entry.updatedAt).getTime() > 180 * 24 * 60 * 60 * 1000);
  return { weak, reused, old };
}