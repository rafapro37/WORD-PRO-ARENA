import React from 'react';
import ReactDOM from 'react-dom/client';
import { LocaleProvider } from './src/contexts/LocaleContext';
import { AppProvider } from './src/contexts/AppContext';
import App from './pages/App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemento root não encontrado.');

// Tenta usar o AppRouter com react-router-dom se disponível
// Se não estiver instalado ainda (npm install pendente), usa o App diretamente
async function mount() {
  let Root: React.ComponentType;

  try {
    const { AppRouter } = await import('./src/router/index');
    Root = AppRouter;
  } catch {
    // react-router-dom não instalado — fallback ao app sem router
    // URLs básicas ainda funcionam via AppContext (History API manual)
    Root = () => (
      <LocaleProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </LocaleProvider>
    );
  }

  ReactDOM.createRoot(rootElement!).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}

mount();
