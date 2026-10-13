import { expect, test } from '@playwright/test';

test('login no mock → criar link → abrir a URL curta → ver o clique nas stats', async ({ page }) => {
  test.setTimeout(90_000);
  const id = Date.now().toString(36);
  const destino = `https://example.com/e2e-${id}`;

  // 1. Login: o botão leva ao /authorize do mock-oauth2-server (login interativo).
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/localhost:8090\/shortener\/authorize/);
  await page.locator('input[name="username"]').fill(`e2e-${id}`); // vira o "sub" do token
  await page.getByRole('button', { name: 'Sign-in' }).click();
  await expect(page).toHaveURL(/\/links$/);
  await expect(page.getByText('Você ainda não criou links.')).toBeVisible();

  // 2. Criar o link.
  await page.getByLabel('URL de destino').fill(destino);
  await page.getByRole('button', { name: 'Encurtar' }).click();
  const shortUrl = (await page.getByRole('status').getByRole('link').textContent()) ?? '';
  expect(shortUrl).toMatch(/^http:\/\/localhost:3000\/[A-Za-z0-9]+$/);
  const code = shortUrl.split('/').pop() ?? '';

  // 3. Abrir a URL curta: 302 para o destino (sem seguir, para não depender da internet).
  const res = await page.request.get(shortUrl, { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()['location']).toBe(destino);

  // 4. Esperar o worker: a lista lê do banco sem cache. Só abrimos o detalhe depois,
  //    para o cache de 60 s das stats não guardar "0 cliques".
  const row = page.getByRole('listitem').filter({ hasText: shortUrl });
  await expect(async () => {
    await page.reload();
    await expect(row).toContainText('1 clique', { timeout: 2_000 });
  }).toPass({ timeout: 45_000 });

  // 5. Detalhe com o clique.
  // exact: o nome casa por substring, e "/<code>" também está dentro da URL curta da mesma linha.
  await row.getByRole('link', { name: `/${code}`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/links/${code}$`));
  await expect(page.getByTestId('total-clicks')).toHaveText('1');
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2); // cabeçalho + 1 navegador

  // 6. Logout volta para a landing.
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});
