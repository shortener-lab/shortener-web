// Espelha src/links/url.ts do shortener-api. Quem decide de verdade é o servidor.
export const MAX_URL_LENGTH = 2048;

export function toTargetUrl(input: string): string | null {
  const value = input.trim();
  if (value.length === 0 || value.length > MAX_URL_LENGTH) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  return value;
}
