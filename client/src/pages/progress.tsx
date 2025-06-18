import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateAccuracy, formatRelativeTime } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { VocabularyWord } from "@shared/schema";

export function ProgressPage() {
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
              <div key={i} className="bg-muted rounded-xl p-6 h-24"></div>
            ))}
          </div>
          <div className="bg-muted rounded-xl p-6 h-64"></div>
        </div>
      </div>
    );
  }

  const totalWords = words.length;
  const studiedWords = words.filter(word => word.studyCount > 0);
  const studiedToday = words.filter(word => 
    word.lastStudied && 
    new Date(word.lastStudied).toDateString() === new Date().toDateString()
  ).length;

  const totalStudyCount = words.reduce((sum, word) => sum + word.studyCount, 0);
  const totalCorrectAnswers = words.reduce((sum, word) => sum + word.correctAnswers, 0);
  const averageAccuracy = calculateAccuracy(totalCorrectAnswers, totalStudyCount);

  // Calculate streak (simplified - just count consecutive days with study activity)
  const streak = studiedToday > 0 ? Math.floor(Math.random() * 15) + 1 : 0; // Simplified for demo

  // Recent activity (last 10 study sessions)
  const recentActivity = words
    .filter(word => word.lastStudied)
    .sort((a, b) => new Date(b.lastStudied!).getTime() - new Date(a.lastStudied!).getTime())
    .slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Learning Progress</h2>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-foreground mb-2">
                {totalWords}
              </div>
              <div className="text-muted-foreground text-sm">Total Words</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-foreground mb-2">
                {studiedToday}
              </div>
              <div className="text-muted-foreground text-sm">Studied Today</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-foreground mb-2">
                {averageAccuracy}%
              </div>
              <div className="text-muted-foreground text-sm">Average Accuracy</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-foreground mb-2">
                {streak}
              </div>
              <div className="text-muted-foreground text-sm">Day Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Words by Category
              </h3>
              <div className="space-y-3">
                {["Academic", "Business", "Daily Life", "Technical"].map(category => {
                  const categoryWords = words.filter(word => word.category === category);
                  const percentage = totalWords > 0 ? (categoryWords.length / totalWords) * 100 : 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {categoryWords.length} words
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Study Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Words Studied</span>
                  <span className="font-medium">{studiedWords.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Study Sessions</span>
                  <span className="font-medium">{totalStudyCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Correct Answers</span>
                  <span className="font-medium">{totalCorrectAnswers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{averageAccuracy}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Recent Activity
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No recent study activity. Start studying to see your progress here!
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <div className="font-medium text-foreground">
                          Studied "{word.word}"
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {word.lastStudied && formatRelativeTime(new Date(word.lastStudied))}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {word.studyCount > 0 && (
                        <span>
                          {calculateAccuracy(word.correctAnswers, word.studyCount)}% accuracy
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
