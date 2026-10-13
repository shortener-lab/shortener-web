import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { shouldRetry } from './queryClient';

describe('shouldRetry', () => {
  it('não repete erro 4xx nem resposta inválida', () => {
    expect(shouldRetry(0, new ApiError(401, 'http_401'))).toBe(false);
    expect(shouldRetry(0, new ApiError(404, 'not_found'))).toBe(false);
    expect(shouldRetry(0, new ApiError(200, 'invalid_response'))).toBe(false);
  });

  it('repete 5xx e falha de rede até 2 vezes', () => {
    expect(shouldRetry(0, new ApiError(503, 'http_503'))).toBe(true);
    expect(shouldRetry(1, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetry(2, new TypeError('Failed to fetch'))).toBe(false);
  });
});
