import { setupServer } from 'msw/node';

// Hosts fictícios: nenhum teste fala com a api ou com o IdP de verdade.
export const TEST_API = 'http://api.test';
export const TEST_AUTHORITY = 'http://idp.test/shortener';

// Sem handlers padrão: cada teste declara o que a "api" responde (server.use).
export const server = setupServer();
