import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { myLink } from '../test/fixtures';
import { renderWithProviders } from '../test/render';
import { server, TEST_API } from '../test/server';
import { LinksPage } from './LinksPage';

const emptyList = () => http.get(`${TEST_API}/me/links`, () => HttpResponse.json({ items: [], nextCursor: null }));

describe('LinksPage', () => {
  it('lista meus links com total de cliques e link para o detalhe', async () => {
    server.use(
      http.get(`${TEST_API}/me/links`, () =>
        HttpResponse.json({ items: [myLink('abc1234', { totalClicks: 3 })], nextCursor: null }),
      ),
    );
    renderWithProviders(<LinksPage />, { route: '/links' });

    const item = await screen.findByRole('listitem');
    expect(item).toHaveTextContent('3 cliques');
    expect(within(item).getByRole('link', { name: '/abc1234' })).toHaveAttribute('href', '/links/abc1234');
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument();
  });

  it('carrega a próxima página com o cursor', async () => {
    server.use(
      http.get(`${TEST_API}/me/links`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        return HttpResponse.json(
          cursor === 'c2' ? { items: [myLink('bbb2222')], nextCursor: null } : { items: [myLink('aaa1111')], nextCursor: 'c2' },
        );
      }),
    );
    const { user } = renderWithProviders(<LinksPage />, { route: '/links' });

    await user.click(await screen.findByRole('button', { name: 'Carregar mais' }));
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument();
  });

  it('lista vazia convida a criar o primeiro link', async () => {
    server.use(emptyList());
    renderWithProviders(<LinksPage />, { route: '/links' });
    expect(await screen.findByText('Você ainda não criou links.')).toBeInTheDocument();
  });

  it('valida a URL no cliente sem chamar a API', async () => {
    let posted = false;
    server.use(
      emptyList(),
      http.post(`${TEST_API}/links`, () => {
        posted = true;
        return new HttpResponse(null, { status: 500 });
      }),
    );
    const { user } = renderWithProviders(<LinksPage />, { route: '/links' });

    await user.type(screen.getByLabelText('URL de destino'), 'ftp://example.com');
    await user.click(screen.getByRole('button', { name: 'Encurtar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('http:// ou https://');
    expect(posted).toBe(false);
  });

  it('cria o link, mostra a URL curta, copia e atualiza a lista', async () => {
    let created = false;
    server.use(
      http.get(`${TEST_API}/me/links`, () =>
        HttpResponse.json({ items: created ? [myLink('new1234')] : [], nextCursor: null }),
      ),
      http.post(`${TEST_API}/links`, async ({ request }) => {
        expect(await request.json()).toEqual({ url: 'https://example.com/novo' });
        created = true;
        const { totalClicks: _omit, ...link } = myLink('new1234');
        return HttpResponse.json(link, { status: 201 });
      }),
    );
    const { user } = renderWithProviders(<LinksPage />, { route: '/links' });
    const input = screen.getByLabelText('URL de destino');

    await user.type(input, 'https://example.com/novo');
    await user.click(screen.getByRole('button', { name: 'Encurtar' }));

    const status = await screen.findByRole('status');
    expect(within(status).getByRole('link', { name: 'http://localhost:3000/new1234' })).toBeInTheDocument();
    await user.click(within(status).getByRole('button', { name: 'Copiar' }));
    expect(await navigator.clipboard.readText()).toBe('http://localhost:3000/new1234');
    expect(within(status).getByRole('button', { name: 'Copiado!' })).toBeInTheDocument();

    expect(await screen.findByRole('listitem')).toHaveTextContent('/new1234');
    expect(input).toHaveValue('');
  });

  it('429 diz quanto tempo esperar', async () => {
    server.use(
      emptyList(),
      http.post(`${TEST_API}/links`, () =>
        HttpResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': '30' } }),
      ),
    );
    const { user } = renderWithProviders(<LinksPage />, { route: '/links' });

    await user.type(screen.getByLabelText('URL de destino'), 'https://example.com');
    await user.click(screen.getByRole('button', { name: 'Encurtar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas requisições. Tente de novo em 30 s.');
  });

  it('401 na lista dispara novo login', async () => {
    server.use(http.get(`${TEST_API}/me/links`, () => new HttpResponse(null, { status: 401 })));
    const { auth } = renderWithProviders(<LinksPage />, { route: '/links' });
    await waitFor(() => expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/links' } }));
  });
});
