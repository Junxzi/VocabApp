import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogIn, User, BookOpen, Sparkles, Shield } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { language, t } = useLanguage();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status using auth endpoint
  const { data: authCheck, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user');
      if (!response.ok) {
        throw new Error('Server error');
      }
      const data = await response.json();
      if (!data.authenticated) {
        throw new Error('Not authenticated');
      }
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0
  });

  useEffect(() => {
    if (!isLoading) {
      setIsCheckingAuth(false);
    }
  }, [isLoading]);

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth login endpoint
    window.location.href = '/auth/google';
  };

  const handleRetry = () => {
    setIsCheckingAuth(true);
    refetch();
  };

  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-center">
                {language === 'en' ? 'Checking authentication...' : '認証を確認中...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && error.message === 'Not authenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {language === 'en' ? 'Welcome to VocabMaster' : 'VocabMasterへようこそ'}
            </CardTitle>
            <p className="text-muted-foreground">
              {language === 'en' 
                ? 'Your intelligent vocabulary learning companion' 
                : 'あなたの知的な語彙学習パートナー'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">
                    {language === 'en' ? 'AI-Powered Learning' : 'AI搭載学習'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'Smart spaced repetition and pronunciation guides' 
                      : 'スマートな間隔反復と発音ガイド'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">
                    {language === 'en' ? 'Daily Challenges' : '毎日のチャレンジ'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? '30 carefully selected words per day' 
                      : '1日30語の厳選された単語'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">
                    {language === 'en' ? 'Personal Progress' : '個人の進捗'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'Track your learning journey with detailed analytics' 
                      : '詳細な分析で学習の軌跡を追跡'}
                  </p>
                </div>
              </div>
            </div>

            {/* Authentication Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {language === 'en' ? 'Secure Authentication' : 'セキュア認証'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {language === 'en' 
                  ? 'Sign in with your Google account to access your personal vocabulary collection and track your learning progress securely.' 
                  : 'Googleアカウントでサインインして、個人の単語帳と学習進捗に安全にアクセスしてください。'}
              </p>
            </div>

            {/* Login Button */}
            <div className="space-y-3">
              <Button 
                onClick={handleGoogleLogin} 
                className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
                size="lg"
              >
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {language === 'en' ? 'Sign in with Google' : 'Googleでサインイン'}
              </Button>
              
              <Button 
                onClick={handleRetry} 
                variant="outline" 
                className="w-full"
              >
                {language === 'en' ? 'Check Again' : '再確認'}
              </Button>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="px-3 py-1">
                {language === 'en' ? 'Authentication Required' : '認証が必要'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">
              {language === 'en' ? 'Connection Error' : '接続エラー'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">
              {language === 'en' 
                ? 'Unable to connect to the server. Please check your connection and try again.' 
                : 'サーバーに接続できません。接続を確認してもう一度お試しください。'}
            </p>
            <Button onClick={handleRetry} className="w-full">
              {language === 'en' ? 'Retry' : '再試行'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated, show the app
  return <>{children}</>;
}