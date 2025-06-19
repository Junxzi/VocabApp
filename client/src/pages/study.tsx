import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, Shuffle, BookOpen, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface DailyChallengeStatus {
  completed: boolean;
  date: string;
  stats?: {
    totalWords: number;
    correctWords: number;
    accuracy: string;
  };
}

export function StudyPage() {
  const { t, language } = useLanguage();

  const { data: dailyChallengeStatus } = useQuery<DailyChallengeStatus>({
    queryKey: ["/api/vocabulary/daily-challenge/status"],
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 ios-scroll">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 md:mb-4">
          {language === "en" ? "Study Mode" : "学習モード"}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          {language === "en" ? "Choose your learning method" : "学習方法を選択してください"}
        </p>
      </div>

      {/* Daily Challenge Highlight */}
      {!dailyChallengeStatus?.completed && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Calendar className="w-5 h-5" />
              {language === "en" ? "Today's Challenge" : "本日の問題"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              {language === "en" 
                ? "Complete today's vocabulary challenge to earn points and track your progress!"
                : "今日の語彙チャレンジを完了してポイントを獲得し、進捗を追跡しましょう！"
              }
            </p>
            <Button 
              onClick={() => window.location.href = '/swipe-study'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {language === "en" ? "Start Daily Challenge" : "デイリーチャレンジを開始"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Completed Daily Challenge */}
      {dailyChallengeStatus?.completed && (
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="font-bold text-green-800 dark:text-green-200 text-lg">
                  {language === "en" ? "Daily Challenge Completed!" : "デイリーチャレンジ完了！"}
                </span>
              </div>
              {dailyChallengeStatus.stats && (
                <div className="text-green-700 dark:text-green-300">
                  {dailyChallengeStatus.stats.correctWords}/{dailyChallengeStatus.stats.totalWords} 
                  ({dailyChallengeStatus.stats.accuracy}%)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Options */}
      <div className="space-y-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shuffle className="w-5 h-5" />
              {language === "en" ? "Random Study" : "ランダム学習"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {language === "en" 
                ? "Study random vocabulary words with swipe cards"
                : "スワイプカードでランダムな語彙を学習"
              }
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/swipe-study'}
              className="w-full"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {language === "en" ? "Start Random Study" : "ランダム学習を開始"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {language === "en" ? "Word List" : "単語帳"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {language === "en" 
                ? "Browse and manage your vocabulary collection"
                : "語彙コレクションを閲覧・管理"
              }
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/vocabulary'}
              className="w-full"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {language === "en" ? "View Word List" : "単語帳を見る"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}