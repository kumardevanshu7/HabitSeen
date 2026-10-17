/**
 * Utility functions for client-side password hashing and verification using Web Crypto API.
 * Uses PBKDF2 with SHA-256 and 100,000 iterations with a unique per-user salt.
 */

export async function hashSecurityAnswer(
  answer: string,
  existingSaltHex?: string
): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const normalized = answer.trim().toLowerCase();

  let saltBytes: Uint8Array;
  if (existingSaltHex) {
    const match = existingSaltHex.match(/.{1,2}/g) || [];
    saltBytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
  } else {
    saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(normalized),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash: hashHex, salt: saltHex };
}

export async function verifySecurityAnswer(
  inputAnswer: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  try {
    const { hash } = await hashSecurityAnswer(inputAnswer, storedSalt);
    if (hash.length !== storedHash.length) return false;
    let diff = 0;
    for (let i = 0; i < hash.length; i++) {
      diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.error('Error verifying security answer:', err);
    return false;
  }
}

export function hasSecurityGuard(user?: { security?: { question?: string; answer?: string; answerHash?: string } } | null): boolean {
  if (!user?.security?.question) return false;
  return Boolean(user.security.answerHash || user.security.answer);
}
