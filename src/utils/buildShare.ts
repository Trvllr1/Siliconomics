import type { Build } from '../types';

const MAX_DECODED_SIZE = 200_000;
const HASH_PREFIX = 'build=';

export function encodeBuildShareUrl(build: Build): string {
  const json = JSON.stringify(build);
  const encoded = btoa(encodeURIComponent(json));
  const url = new URL(window.location.href);
  url.hash = `${HASH_PREFIX}${encoded}`;
  return url.toString();
}

export function decodeBuildFromHash(): { build: Build | null; error: string | null } {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith(`#${HASH_PREFIX}`)) {
    return { build: null, error: null };
  }

  const encoded = hash.slice(HASH_PREFIX.length + 1);
  if (!encoded) {
    return { build: null, error: null };
  }

  try {
    const decoded = decodeURIComponent(atob(encoded));

    if (decoded.length > MAX_DECODED_SIZE) {
      return { build: null, error: 'Shared build payload exceeds size limit.' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(decoded);
    } catch {
      return { build: null, error: 'Shared build data is malformed (invalid JSON).' };
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return { build: null, error: 'Shared build data is not an object.' };
    }

    const obj = parsed as Record<string, unknown>;

    if (typeof obj.id !== 'string' || typeof obj.name !== 'string') {
      return { build: null, error: 'Shared build missing required fields (id, name).' };
    }
    if (!obj.designModel || typeof obj.designModel !== 'object') {
      return { build: null, error: 'Shared build missing designModel.' };
    }

    const build = parsed as Build;
    return { build, error: null };
  } catch {
    return { build: null, error: 'Shared build data is corrupted or invalid.' };
  }
}

export function clearShareHash(): void {
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}
