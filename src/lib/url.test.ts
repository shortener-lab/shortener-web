import { describe, expect, it } from 'vitest';
import { MAX_URL_LENGTH, toTargetUrl } from './url';

describe('toTargetUrl', () => {
  it('aceita http e https (com espaços em volta)', () => {
    expect(toTargetUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(toTargetUrl('  http://example.com  ')).toBe('http://example.com');
  });

  it('recusa outros protocolos, texto sem esquema e vazio', () => {
    expect(toTargetUrl('ftp://example.com')).toBeNull();
    expect(toTargetUrl('javascript:alert(1)')).toBeNull();
    expect(toTargetUrl('example.com')).toBeNull();
    expect(toTargetUrl('   ')).toBeNull();
  });

  it('recusa acima do limite do servidor', () => {
    const longa = `https://example.com/${'a'.repeat(MAX_URL_LENGTH)}`;
    expect(toTargetUrl(longa)).toBeNull();
  });
});
