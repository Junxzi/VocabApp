import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { 
  LogOut,
  User
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavigationProps {
  onAddWordClick: () => void;
  onImportClick: () => void;
}

export function Navigation({ onAddWordClick, onImportClick }: NavigationProps) {
  const { t } = useLanguage();
  const { isAuthenticated, userName, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-background/95 backdrop-blur-lg border-b border-border/40 sticky top-0 z-50 safe-area-inset-top shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-18 md:h-20">
          <div className="flex items-center space-x-4 md:space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{t("nav.title")}</h1>
            </div>

          </div>
          <div className="flex items-center">
             {/* User Dropdown */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    {userName && (
                      <span className="text-sm hidden md:block max-w-[120px] truncate">
                        {userName}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">ログイン中</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            <Link href="/settings">
              <Button variant="ghost" size="lg" className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Settings className="w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

    </nav>
  );
}