import { Link, useParams } from 'react-router';
import { ApiError, describeError } from '../api/client';
import { useStats } from '../api/hooks';
import { DailyChart } from '../components/DailyChart';
import { Freshness } from '../components/Freshness';
import { lastNDays } from '../lib/days';

export function LinkDetailPage() {
  const { code = '' } = useParams();
  const query = useStats(code);

  if (query.isPending) return <p className="muted">Carregando estatísticas…</p>;

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) {
      return (
        <section className="card">
          <h1>Link não encontrado</h1>
          <p className="muted">Ele não existe ou pertence a outra conta.</p>
          <Link to="/links">Voltar para meus links</Link>
        </section>
      );
    }
    return <p role="alert" className="error">{describeError(query.error)}</p>;
  }

  const stats = query.data;
  return (
    <>
      <p>
        <Link to="/links">← Meus links</Link>
      </p>
      <h1>/{stats.code}</h1>
      <p className="dest">
        Destino: <a href={stats.url} target="_blank" rel="noreferrer">{stats.url}</a>
      </p>

      <section className="card stat">
        <span className="muted">Total de cliques</span>
        <strong data-testid="total-clicks">{stats.totalClicks.toLocaleString('pt-BR')}</strong>
        {stats.computedAt !== undefined && stats.refreshInSeconds !== undefined && (
          <Freshness
            computedAt={stats.computedAt}
            refreshInSeconds={stats.refreshInSeconds}
            receivedAt={query.dataUpdatedAt}
          />
        )}
      </section>

      <h2>Últimos 30 dias</h2>
      <DailyChart days={lastNDays(stats.daily, new Date())} />

      <h2>Navegadores</h2>
      {stats.browsers.length === 0 ? (
        <p className="muted">Nenhum clique ainda.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Navegador</th>
              <th className="num">Cliques</th>
            </tr>
          </thead>
          <tbody>
            {stats.browsers.map((b) => (
              <tr key={b.browser}>
                <td>{b.browser}</td>
                <td className="num">{b.clicks.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
