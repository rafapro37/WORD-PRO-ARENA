import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Locale, getSavedLocale, saveLocale, t, TranslationKey, AVAILABLE_LOCALES } from '../i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  T: TranslationKey;
  availableLocales: typeof AVAILABLE_LOCALES;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(getSavedLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    saveLocale(newLocale);
  }, []);

  // Aplicar lang no html para acessibilidade
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, T: t(locale), availableLocales: AVAILABLE_LOCALES }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextValue => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale deve ser usado dentro de LocaleProvider');
  return ctx;
};
