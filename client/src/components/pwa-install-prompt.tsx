
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone === true;
    
    setIsIOS(iOS);
    setIsStandalone(isInStandaloneMode);

    // For iOS, show custom prompt if not in standalone mode and not dismissed
    if (iOS && !isInStandaloneMode && !localStorage.getItem('pwa-install-dismissed')) {
      setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!iOS) { // Only show for non-iOS devices
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 shadow-lg" style={{ 
      marginBottom: 'max(env(safe-area-inset-bottom), 16px)'
    }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              {isIOS ? 'ホーム画面に追加' : 'アプリをインストール'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isIOS 
                ? 'Safariの共有ボタンから「ホーム画面に追加」を選択してください' 
                : 'ホーム画面に追加してネイティブアプリのように使用'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isIOS && deferredPrompt && (
              <Button size="sm" onClick={handleInstall} className="haptic-light">
                <Download className="w-4 h-4 mr-1" />
                インストール
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="haptic-light">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
