import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Trophy, 
  Target, 
  Calendar, 
  Brain, 
  TrendingUp, 
  Award,
  Clock,
  Star,
  Flame,
  BookOpen,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { calculateAccuracy, formatRelativeTime, CATEGORIES } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
// Note: isDueForReview function will be implemented inline since it's a simple date check
import type { VocabularyWord } from "@shared/schema";

interface BadgeDefinition {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requirement: (words: VocabularyWord[], streak: number) => boolean;
  progress: (words: VocabularyWord[], streak: number) => number;
  max: number;
}

export function ProgressPage() {
  const { t } = useLanguage();
  const { data: words = [], isLoading } = useQuery<VocabularyWord[]>({
    queryKey: ["/api/vocabulary"],
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-xl p-6 h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-muted rounded-xl p-6 h-96"></div>
            <div className="bg-muted rounded-xl p-6 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate core metrics
  const totalWords = words.length;
  const studiedWords = words.filter(word => (word.studyCount || 0) > 0);
  const studiedToday = words.filter(word => 
    word.lastStudied && 
    new Date(word.lastStudied).toDateString() === new Date().toDateString()
  ).length;

  const totalStudyCount = words.reduce((sum, word) => sum + (word.studyCount || 0), 0);
  const totalCorrectAnswers = words.reduce((sum, word) => sum + (word.correctAnswers || 0), 0);
  const averageAccuracy = calculateAccuracy(totalCorrectAnswers, totalStudyCount);

  // Calculate streak (consecutive days with study activity)
  const streak = calculateStreak(words);
  
  // Review management data
  const wordsForReview = words.filter(word => 
    word.nextReview && new Date(word.nextReview) <= new Date()
  );
  const highPriorityWords = wordsForReview.filter(word => (word.difficulty || 0) >= 3);
  const wellMemorizedWords = words.filter(word => 
    word.easeFactor && parseFloat(word.easeFactor.toString()) > 2.8
  );

  // Badge system
  const badges: BadgeDefinition[] = [
    {
      id: 'firstWord',
      icon: BookOpen,
      color: 'text-blue-500',
      requirement: (words) => words.some(w => (w.studyCount || 0) > 0),
      progress: (words) => words.some(w => (w.studyCount || 0) > 0) ? 1 : 0,
      max: 1
    },
    {
      id: 'streakBeginner',
      icon: Calendar,
      color: 'text-green-500',
      requirement: (_, streak) => streak >= 3,
      progress: (_, streak) => Math.min(streak, 3),
      max: 3
    },
    {
      id: 'streakWarrior',
      icon: Flame,
      color: 'text-orange-500',
      requirement: (_, streak) => streak >= 7,
      progress: (_, streak) => Math.min(streak, 7),
      max: 7
    },
    {
      id: 'streakMaster',
      icon: Trophy,
      color: 'text-purple-500',
      requirement: (_, streak) => streak >= 30,
      progress: (_, streak) => Math.min(streak, 30),
      max: 30
    },
    {
      id: 'vocabularyBuilder',
      icon: Target,
      color: 'text-cyan-500',
      requirement: (words) => words.filter(w => (w.studyCount || 0) > 0).length >= 50,
      progress: (words) => Math.min(words.filter(w => (w.studyCount || 0) > 0).length, 50),
      max: 50
    },
    {
      id: 'vocabularyExpert',
      icon: Brain,
      color: 'text-indigo-500',
      requirement: (words) => words.filter(w => (w.studyCount || 0) > 0).length >= 200,
      progress: (words) => Math.min(words.filter(w => (w.studyCount || 0) > 0).length, 200),
      max: 200
    },
    {
      id: 'accuracyAce',
      icon: Star,
      color: 'text-yellow-500',
      requirement: () => averageAccuracy >= 90,
      progress: () => Math.min(averageAccuracy, 90),
      max: 90
    },
    {
      id: 'categoryMaster',
      icon: Award,
      color: 'text-pink-500',
      requirement: (words) => {
        const studiedTags = new Set(
          words.filter(w => (w.studyCount || 0) > 0).flatMap(w => w.tags || [])
        );
        return studiedTags.size >= CATEGORIES.length;
      },
      progress: (words) => {
        const studiedTags = new Set(
          words.filter(w => (w.studyCount || 0) > 0).flatMap(w => w.tags || [])
        );
        return Math.min(studiedTags.size, CATEGORIES.length);
      },
      max: CATEGORIES.length
    }
  ];

  const unlockedBadges = badges.filter(badge => badge.requirement(words, streak));
  const lockedBadges = badges.filter(badge => !badge.requirement(words, streak));

  // Tag breakdown
  const allTags = Array.from(new Set(words.flatMap(w => w.tags || [])));
  const tagStats = allTags.map(tag => {
    const tagWords = words.filter(w => w.tags?.includes(tag));
    const studiedInTag = tagWords.filter(w => (w.studyCount || 0) > 0);
    return {
      name: tag,
      total: tagWords.length,
      studied: studiedInTag.length,
      accuracy: tagWords.length > 0 ? 
        calculateAccuracy(
          tagWords.reduce((sum, w) => sum + (w.correctAnswers || 0), 0),
          tagWords.reduce((sum, w) => sum + (w.studyCount || 0), 0)
        ) : 0
    };
  }).filter(stat => stat.total > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mt-[34px] mb-[34px]">
          {t('learningProgress')}
        </h1>
        <p className="text-muted-foreground mt-[30px] mb-[30px] pt-[0px] pb-[0px]">
          {t('progress.description')}
        </p>
      </div>
      {/* Today's Progress Dashboard */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {t('todayProgress')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">{studiedToday}</div>
              <div className="text-sm text-muted-foreground">{t('wordsStudied')}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-3xl font-bold text-orange-500">{streak}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {t('streak')} ({streak === 1 ? t('day') : t('days')})
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {averageAccuracy.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">{t('averageAccuracy')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-1">
                {studiedWords.length}/{totalWords}
              </div>
              <div className="text-sm text-muted-foreground">{t('totalWords')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Achievements & Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {t('achievements')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Unlocked Badges */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('unlockedBadges')} ({unlockedBadges.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {unlockedBadges.map(badge => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.id} className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-5 h-5 ${badge.color}`} />
                        <span className="font-medium text-sm">{t(badge.id)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{t(`${badge.id}Desc`)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Locked Badges */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                {t('badgeProgress')}
              </h3>
              <div className="space-y-3">
                {lockedBadges.slice(0, 3).map(badge => {
                  const Icon = badge.icon;
                  const progress = badge.progress(words, streak);
                  const percentage = (progress / badge.max) * 100;
                  return (
                    <div key={badge.id} className="p-3 rounded-lg bg-muted/30 border-dashed border">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">{t(badge.id)}</span>
                      </div>
                      <Progress value={percentage} className="h-2 mb-1" />
                      <p className="text-xs text-muted-foreground">
                        {progress}/{badge.max} - {t(`${badge.id}Desc`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('reviewManagement')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Review Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {wordsForReview.length}
                </div>
                <div className="text-sm text-red-600">{t('dueForReview')}</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {wellMemorizedWords.length}
                </div>
                <div className="text-sm text-green-600">{t('wellMemorized')}</div>
              </div>
            </div>

            {/* High Priority Words */}
            {highPriorityWords.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  {t('highPriority')} ({highPriorityWords.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {highPriorityWords.slice(0, 5).map(word => (
                    <div key={word.id} className="flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <span className="font-medium text-sm">{word.word}</span>
                      <Badge variant="destructive" className="text-xs">
                        {t('needsReview')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Action */}
            {wordsForReview.length > 0 && (
              <Button className="w-full" variant="default">
                <Clock className="w-4 h-4 mr-2" />
                {t('reviewNow')} ({wordsForReview.length})
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Learning Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('learningStatistics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">{t('performanceMetrics')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('totalStudySessions')}</span>
                  <span className="font-semibold">{totalStudyCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('correctAnswers')}</span>
                  <span className="font-semibold">{totalCorrectAnswers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('successRate')}</span>
                  <span className="font-semibold">{averageAccuracy.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">{t('categoryBreakdown')}</h3>
              <div className="space-y-3">
                {tagStats.map(stat => (
                  <div key={stat.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{stat.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {stat.studied}/{stat.total}
                      </span>
                    </div>
                    <Progress 
                      value={(stat.studied / stat.total) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">{t('recentActivity')}</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {words
                  .filter(word => word.lastStudied)
                  .sort((a, b) => new Date(b.lastStudied!).getTime() - new Date(a.lastStudied!).getTime())
                  .slice(0, 5)
                  .map(word => (
                    <div key={word.id} className="flex items-center space-x-3 p-2 rounded-md bg-muted/50">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {t('studiedWord').replace('{{word}}', word.word)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {word.lastStudied && formatRelativeTime(new Date(word.lastStudied))}
                        </div>
                      </div>
                    </div>
                  ))}
                {words.filter(w => w.lastStudied).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('noRecentActivity')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <MobileBottomNav />
    </div>
  );
}

// Helper function to calculate study streak
function calculateStreak(words: VocabularyWord[]): number {
  const studiedDates = words
    .filter(word => word.lastStudied)
    .map(word => new Date(word.lastStudied!).toDateString())
    .filter((date, index, arr) => arr.indexOf(date) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (studiedDates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toDateString();
  
  for (let i = 0; i < studiedDates.length; i++) {
    const currentDate = new Date(studiedDates[i]);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (currentDate.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}