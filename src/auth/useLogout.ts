import { useAuth } from 'react-oidc-context';
import { getConfig } from '../config';
import { buildLogoutUrl } from './oidc';

export function useLogout(): () => Promise<void> {
  const auth = useAuth();
  return async () => {
    const { oidcLogoutUrl, oidcClientId } = getConfig();
    if (oidcLogoutUrl) {
      // Cognito: não há end_session_endpoint na discovery; limpamos local e vamos ao /logout dele.
      await auth.removeUser();
      window.location.assign(buildLogoutUrl(oidcLogoutUrl, oidcClientId, window.location.origin));
      return;
    }
    await auth.signoutRedirect(); // mock: end_session_endpoint → volta para post_logout_redirect_uri
  };
}
