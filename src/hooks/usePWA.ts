import { useState, useEffect, useCallback } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type PushPermission = 'default' | 'granted' | 'denied';

export interface PWAState {
  isInstallable:    boolean;
  isInstalled:      boolean;
  isOnline:         boolean;
  pushPermission:   PushPermission;
  promptInstall:    () => Promise<boolean>;
  requestPush:      () => Promise<PushPermission>;
}

export function usePWA(): PWAState {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled,   setIsInstalled]   = useState(false);
  const [isOnline,      setIsOnline]      = useState(navigator.onLine);
  const [pushPermission, setPushPermission] = useState<PushPermission>(
    typeof Notification !== 'undefined' ? Notification.permission as PushPermission : 'default'
  );

  // Detectar prompt de instalação
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Detectar se já instalado (display-mode standalone)
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Online/Offline
  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
    return outcome === 'accepted';
  }, [installPrompt]);

  const requestPush = useCallback(async (): Promise<PushPermission> => {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    setPushPermission(result as PushPermission);
    return result as PushPermission;
  }, []);

  return {
    isInstallable:  !!installPrompt && !isInstalled,
    isInstalled,
    isOnline,
    pushPermission,
    promptInstall,
    requestPush,
  };
}
