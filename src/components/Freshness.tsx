import { useEffect, useState } from 'react';

const timeFormat = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'medium' });

// computedAt vem do relógio da api e só é exibido. A contagem usa refreshInSeconds a partir de quando
// a resposta chegou (receivedAt), então não depende do relógio do usuário bater com o do servidor.
export function Freshness({
  computedAt,
  refreshInSeconds,
  receivedAt,
}: {
  computedAt: string;
  refreshInSeconds: number;
  receivedAt: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - receivedAt) / 1000));
  const remaining = Math.max(0, refreshInSeconds - elapsed);

  // Sem aria-live de propósito: um leitor de tela anunciaria a contagem a cada segundo.
  return (
    <p className="freshness muted">
      Atualizado às <time dateTime={computedAt}>{timeFormat.format(new Date(computedAt))}</time>
      <span aria-hidden="true"> · </span>
      <span>{remaining > 0 ? `próxima atualização em ${remaining} s` : 'atualizando…'}</span>
    </p>
  );
}
