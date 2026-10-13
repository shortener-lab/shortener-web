import { Link } from 'react-router';
import { describeError } from '../api/client';
import { useMyLinks } from '../api/hooks';
import { clicksLabel, formatDate } from '../lib/format';
import { CopyButton } from './CopyButton';

export function LinkList() {
  const query = useMyLinks();

  if (query.isPending) return <p className="muted">Carregando links…</p>;
  if (query.isLoadingError) return <p role="alert" className="error">{describeError(query.error)}</p>;

  const items = query.data.pages.flatMap((page) => page.items);
  if (items.length === 0) return <p className="muted">Você ainda não criou links.</p>;

  return (
    <section>
      <ul className="link-list">
        {items.map((link) => (
          <li key={link.code} className="link-item">
            <div className="link-main">
              <Link to={`/links/${link.code}`} className="code">/{link.code}</Link>
              <a href={link.shortUrl} target="_blank" rel="noreferrer">{link.shortUrl}</a>
              <span className="dest" title={link.url}>{link.url}</span>
            </div>
            <div className="link-meta">
              <span>{clicksLabel(link.totalClicks)}</span>
              <span className="muted">{formatDate(link.createdAt)}</span>
              <CopyButton text={link.shortUrl} />
            </div>
          </li>
        ))}
      </ul>
      {query.isError && <p role="alert" className="error">{describeError(query.error)}</p>}
      {query.hasNextPage && (
        <button
          type="button"
          className="secondary more"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          {query.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
        </button>
      )}
    </section>
  );
}
