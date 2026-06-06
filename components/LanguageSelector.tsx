import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from '../src/contexts/LocaleContext';
import { AVAILABLE_LOCALES, Locale } from '../src/i18n';

interface LanguageSelectorProps {
  /** 'compact' = só a bandeira + código. 'full' = bandeira + nome completo */
  variant?: 'compact' | 'full';
  /** Posição do dropdown: 'down' (padrão) ou 'up' */
  dropDirection?: 'down' | 'up';
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  dropDirection = 'down',
  className = '',
}) => {
  const { locale, setLocale, T } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = AVAILABLE_LOCALES.find(l => l.code === locale) ?? AVAILABLE_LOCALES[0];

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      {/* Botão trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--primary)] transition-all duration-200 text-sm font-medium text-[var(--text-main)]"
        aria-label={T.landing.selectLang}
      >
        <span className="text-base leading-none">{current.flag}</span>
        {variant === 'full' && (
          <span className="hidden sm:inline">{current.label}</span>
        )}
        {variant === 'compact' && (
          <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--text-secondary)]">
            {current.code.toUpperCase()}
          </span>
        )}
        <svg
          className={`w-3 h-3 text-[var(--text-secondary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute z-50 w-44 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden ${
            dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          } right-0`}
        >
          {AVAILABLE_LOCALES.map(loc => (
            <button
              key={loc.code}
              onClick={() => { setLocale(loc.code as Locale); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150 hover:bg-[var(--primary)]/10 ${
                locale === loc.code
                  ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-bold'
                  : 'text-[var(--text-main)]'
              }`}
            >
              <span className="text-lg leading-none">{loc.flag}</span>
              <span>{loc.label}</span>
              {locale === loc.code && (
                <svg className="w-4 h-4 ml-auto text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
