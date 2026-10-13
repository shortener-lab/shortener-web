import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createWrapper, fakeAuth } from '../test/render';
import { useLogout } from './useLogout';

describe('useLogout', () => {
  it('sem oidcLogoutUrl (mock), usa o end_session do IdP via signoutRedirect', async () => {
    const auth = fakeAuth();
    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper({ auth }) });
    await result.current();
    expect(auth.signoutRedirect).toHaveBeenCalledTimes(1);
    expect(auth.removeUser).not.toHaveBeenCalled();
  });
});
