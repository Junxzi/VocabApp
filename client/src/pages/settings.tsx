import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { Globe, Volume2, Eye, RefreshCw, Trash2, Download, Bell, LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function SettingsPage() {
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [autoplay, setAutoplay] = useState(() => {
    return localStorage.getItem("autoplay") === "true";
  });
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });
  const [studyMode, setStudyMode] = useState(() => {
    return localStorage.getItem("studyMode") || "swipe";
  });
  const [pronunciationAccent, setPronunciationAccent] = useState(() => {
    return localStorage.getItem("pronunciationAccent") || "us";
  });
  
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem("notificationsEnabled") === "true";
  });
  const [notificationTime, setNotificationTime] = useState(() => {
    return localStorage.getItem("notificationTime") || "09:00";
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // User authentication query
  const { data: userAuth } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Check notification permission on mount and schedule if needed
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Schedule notification if notifications are enabled
      if (notificationsEnabled && Notification.permission === 'granted') {
        scheduleNotification(notificationTime);
      }
    }
  }, []);

  // Update scheduled notifications when language changes
  useEffect(() => {
    if (notificationsEnabled && notificationPermission === 'granted') {
      scheduleNotification(notificationTime);
    }
  }, [language]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    }
    return 'denied';
  };

  const scheduleNotification = (time: string) => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      return;
    }

    // Parse the time
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    // Clear any existing timeout
    const existingTimeoutId = localStorage.getItem('notificationTimeoutId');
    if (existingTimeoutId) {
      clearTimeout(Number(existingTimeoutId));
    }

    // Schedule the notification
    const timeoutId = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(language === 'en' ? 'VocabMaster Daily Challenge' : 'VocabMaster 今日のチャレンジ', {
          body: language === 'en' 
            ? 'Time for your daily vocabulary challenge! 📚' 
            : '今日の単語チャレンジの時間です！📚',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'daily-challenge',
          requireInteraction: true
        });
      }
      
      // Reschedule for next day
      if (notificationsEnabled) {
        scheduleNotification(time);
      }
    }, timeUntilNotification);

    localStorage.setItem('notificationTimeoutId', timeoutId.toString());
  };

  const handleLanguageChange = (newLanguage: "en" | "ja") => {
    setLanguage(newLanguage);
    toast({
      title: language === "en" ? "Language Updated" : "言語を更新しました",
      description: newLanguage === "en" ? "Interface language changed to English" : "インターフェース言語を日本語に変更しました",
    });
  };

  const handleAutoplayChange = (enabled: boolean) => {
    setAutoplay(enabled);
    localStorage.setItem("autoplay", enabled.toString());
    toast({
      title: language === "en" ? "Settings Updated" : "設定を更新しました",
      description: language === "en" 
        ? `Auto-pronunciation ${enabled ? "enabled" : "disabled"}` 
        : `自動発音を${enabled ? "有効" : "無効"}にしました`,
    });
  };

  const handleDarkModeChange = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    toast({
      title: language === "en" ? "Theme Updated" : "テーマを更新しました",
      description: language === "en" 
        ? `${enabled ? "Dark" : "Light"} mode enabled` 
        : `${enabled ? "ダーク" : "ライト"}モードに変更しました`,
    });
  };

  const handleStudyModeChange = (mode: string) => {
    setStudyMode(mode);
    localStorage.setItem("studyMode", mode);
    toast({
      title: language === "en" ? "Study Mode Updated" : "学習モードを更新しました",
      description: language === "en" 
        ? `Study mode changed to ${mode}` 
        : `学習モードを${mode === "swipe" ? "スワイプ" : "カード"}に変更しました`,
    });
  };

  const handlePronunciationAccentChange = (accent: string) => {
    setPronunciationAccent(accent);
    localStorage.setItem("pronunciationAccent", accent);
    toast({
      title: language === "en" ? "Pronunciation Updated" : "発音設定を更新しました",
      description: language === "en" 
        ? `Accent changed to ${accent.toUpperCase()}` 
        : `アクセントを${accent.toUpperCase()}に変更しました`,
    });
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    if (enabled && notificationPermission !== 'granted') {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        toast({
          title: language === "en" ? "Permission Required" : "権限が必要です",
          description: language === "en" 
            ? "Please allow notifications to enable daily reminders" 
            : "通知を有効にするために通知許可が必要です",
          variant: "destructive"
        });
        return;
      }
    }

    setNotificationsEnabled(enabled);
    localStorage.setItem("notificationsEnabled", enabled.toString());
    
    if (enabled) {
      scheduleNotification(notificationTime);
    } else {
      // Clear existing notification
      const existingTimeoutId = localStorage.getItem('notificationTimeoutId');
      if (existingTimeoutId) {
        clearTimeout(Number(existingTimeoutId));
        localStorage.removeItem('notificationTimeoutId');
      }
    }

    toast({
      title: language === "en" ? "Notifications Updated" : "通知設定を更新しました",
      description: language === "en" 
        ? `Daily reminders ${enabled ? "enabled" : "disabled"}` 
        : `日次リマインダーを${enabled ? "有効" : "無効"}にしました`,
    });
  };

  const handleNotificationTimeChange = (time: string) => {
    setNotificationTime(time);
    localStorage.setItem("notificationTime", time);
    
    // Reschedule if notifications are enabled
    if (notificationsEnabled) {
      scheduleNotification(time);
    }

    toast({
      title: language === "en" ? "Reminder Time Updated" : "リマインダー時刻を更新しました",
      description: language === "en" 
        ? `Daily reminder set for ${time}` 
        : `日次リマインダーを${time}に設定しました`,
    });
  };

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  const handleResetSettings = () => {
    localStorage.removeItem("autoplay");
    localStorage.removeItem("studyMode");
    localStorage.removeItem("pronunciationAccent");
    localStorage.removeItem("theme");
    localStorage.removeItem("notificationsEnabled");
    localStorage.removeItem("notificationTime");
    localStorage.removeItem("notificationTimeoutId");
    
    // Clear any existing notification timeout
    const existingTimeoutId = localStorage.getItem('notificationTimeoutId');
    if (existingTimeoutId) {
      clearTimeout(Number(existingTimeoutId));
    }
    
    setAutoplay(false);
    setStudyMode("swipe");
    setPronunciationAccent("us");
    setDarkMode(false);
    setNotificationsEnabled(false);
    setNotificationTime("09:00");
    document.documentElement.classList.remove("dark");
    toast({
      title: language === "en" ? "Settings Reset" : "設定をリセットしました",
      description: language === "en" ? "All settings restored to default" : "すべての設定をデフォルトに戻しました",
    });
  };

  const handleExportData = () => {
    // This would export vocabulary data in the future
    toast({
      title: language === "en" ? "Export Coming Soon" : "エクスポート機能開発中",
      description: language === "en" ? "Data export feature will be available soon" : "データエクスポート機能は近日公開予定です",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mt-[46px] mb-[46px]">
            {language === "en" ? "Settings" : "設定"}
          </h1>
          <p className="text-muted-foreground">
            {language === "en" ? "Customize your learning experience" : "学習体験をカスタマイズ"}
          </p>
        </div>

        {/* User Account Section */}
        {userAuth?.authenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {language === "en" ? "Account" : "アカウント"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{userAuth.userName || userAuth.user?.name || "User"}</p>
                  <p className="text-sm text-muted-foreground">
                    {userAuth.user?.email || `ID: ${userAuth.userId}`}
                  </p>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  {language === "en" ? "Google Account" : "Googleアカウント"}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    {language === "en" ? "Authentication" : "認証"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "en" ? "Signed in with Google OAuth" : "Google OAuthでサインイン中"}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {language === "en" ? "Sign Out" : "サインアウト"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {language === "en" ? "Language" : "言語"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="language-select">
                {language === "en" ? "Interface Language" : "インターフェース言語"}
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              {language === "en" ? "Audio" : "音声"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoplay-switch">
                {language === "en" ? "Auto-play pronunciation" : "自動発音再生"}
              </Label>
              <Switch
                id="autoplay-switch"
                checked={autoplay}
                onCheckedChange={handleAutoplayChange}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <Label htmlFor="accent-select">
                {language === "en" ? "Pronunciation Accent" : "発音アクセント"}
              </Label>
              <Select value={pronunciationAccent} onValueChange={handlePronunciationAccentChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">US</SelectItem>
                  <SelectItem value="uk">UK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {language === "en" ? "Notifications" : "通知"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications-switch">
                  {language === "en" ? "Daily Study Reminders" : "日次学習リマインダー"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Get notified to complete your daily challenge" : "毎日のチャレンジの通知を受け取る"}
                </p>
              </div>
              <Switch
                id="notifications-switch"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationsChange}
              />
            </div>
            
            {notificationsEnabled && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="notification-time">
                    {language === "en" ? "Reminder Time" : "リマインダー時刻"}
                  </Label>
                  <Input
                    id="notification-time"
                    type="time"
                    value={notificationTime}
                    onChange={(e) => handleNotificationTimeChange(e.target.value)}
                    className="w-32"
                  />
                </div>
                
                {notificationPermission !== 'granted' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {language === "en" 
                        ? "Notification permission required to receive daily reminders" 
                        : "日次リマインダーを受信するには通知許可が必要です"}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {language === "en" ? "Display" : "表示"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode-switch">
                {language === "en" ? "Dark Mode" : "ダークモード"}
              </Label>
              <Switch
                id="dark-mode-switch"
                checked={darkMode}
                onCheckedChange={handleDarkModeChange}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <Label htmlFor="study-mode-select">
                {language === "en" ? "Default Study Mode" : "デフォルト学習モード"}
              </Label>
              <Select value={studyMode} onValueChange={handleStudyModeChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="swipe">
                    {language === "en" ? "Swipe" : "スワイプ"}
                  </SelectItem>
                  <SelectItem value="card">
                    {language === "en" ? "Card" : "カード"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              {language === "en" ? "Data Management" : "データ管理"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>
                  {language === "en" ? "Export Vocabulary" : "単語データをエクスポート"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Download your vocabulary as CSV" : "単語データをCSV形式でダウンロード"}
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                {language === "en" ? "Export" : "エクスポート"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reset Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              {language === "en" ? "Reset" : "リセット"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>
                  {language === "en" ? "Reset All Settings" : "すべての設定をリセット"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Restore default settings" : "デフォルト設定に戻す"}
                </p>
              </div>
              <Button variant="destructive" onClick={handleResetSettings}>
                <Trash2 className="w-4 h-4 mr-2" />
                {language === "en" ? "Reset" : "リセット"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="pb-20" />
      </div>
    </div>
  );
}