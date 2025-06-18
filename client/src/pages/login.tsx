
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">VocabMaster</CardTitle>
          <p className="text-gray-600">個人用単語帳アプリ</p>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-sm text-gray-600">
            ログインして自分だけの単語帳を作成しましょう
          </p>
          <div>
            <script
              src="https://auth.util.repl.co/script.js"
              data-repl-auth
              data-style="button"
              data-text="Replitでログイン"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
