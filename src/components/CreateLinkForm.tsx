import { useState, type FormEvent } from 'react';
import { describeError } from '../api/client';
import { useCreateLink } from '../api/hooks';
import { toTargetUrl } from '../lib/url';
import { CopyButton } from './CopyButton';

export function CreateLinkForm() {
  const [value, setValue] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const create = useCreateLink();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = toTargetUrl(value);
    if (!url) {
      setClientError('Informe uma URL http:// ou https:// válida (até 2048 caracteres).');
      return;
    }
    setClientError(null);
    create.mutate(url, { onSuccess: () => setValue('') });
  }

  const error = clientError ?? (create.error ? describeError(create.error) : null);

  return (
    <section className="card">
      <form className="create-form" onSubmit={onSubmit} noValidate>
        <label htmlFor="target-url">URL de destino</label>
        <div className="row">
          <input
            id="target-url"
            type="url"
            inputMode="url"
            placeholder="https://..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'target-url-error' : undefined}
          />
          <button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Encurtando…' : 'Encurtar'}
          </button>
        </div>
        {error && (
          <p id="target-url-error" role="alert" className="error">
            {error}
          </p>
        )}
      </form>
      {create.data && !error && (
        <div role="status" className="created">
          <span>Link criado:</span>
          <a href={create.data.shortUrl} target="_blank" rel="noreferrer">
            {create.data.shortUrl}
          </a>
          <CopyButton text={create.data.shortUrl} />
        </div>
      )}
    </section>
  );
}
