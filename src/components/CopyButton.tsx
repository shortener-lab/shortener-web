import { useEffect, useState } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Sem permissão de clipboard (ex.: http fora de localhost): o link continua visível para copiar à mão.
    }
  }

  return (
    <button type="button" className="secondary" onClick={() => void copy()}>
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  );
}
