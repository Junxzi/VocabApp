import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogIn, User, BookOpen, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { language, t } = useLanguage();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status by trying to fetch vocabulary
  const { data: authCheck, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/vocabulary'],
    queryFn: async () => {
      const response = await fetch('/api/vocabulary');
      if (response.status === 401) {
        throw new Error('Not authenticated');
      }
      if (!response.ok) {
        throw new Error('Server error');
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (!isLoading) {
      setIsCheckingAuth(false);
    }
  }, [isLoading]);

  const handleLogin = () => {
    // Replit authentication - reload the page to trigger auth
    window.location.reload();
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
              <p className="text-sm text-muted-foreground text-center">
                {language === 'en' 
                  ? 'Please sign in with your Replit account to access your personal vocabulary collection and progress tracking.' 
                  : 'Replitアカウントでサインインして、個人の単語帳と進捗追跡にアクセスしてください。'}
              </p>
            </div>

            {/* Login Button */}
            <div className="space-y-3">
              <Button 
                onClick={handleLogin} 
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                <LogIn className="h-5 w-5 mr-2" />
                {language === 'en' ? 'Sign in with Replit' : 'Replitでサインイン'}
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