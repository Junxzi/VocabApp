import { Link, useLocation } from "wouter";
import { Home, BookOpen, TrendingUp, Shuffle, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

interface MobileBottomNavProps {
  onAddWordClick: () => void;
}

export function MobileBottomNav({ onAddWordClick }: MobileBottomNavProps) {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { label: t("nav.vocabulary"), href: "/", icon: Home },
    { label: t("nav.study"), href: "/swipe-study", icon: BookOpen },
    { label: t("nav.progress"), href: "/progress", icon: TrendingUp },
    { label: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-inset-bottom z-50 md:hidden">
      <div className="flex items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors duration-200 touch-manipulation",
                isActive
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
            </Link>
          );
        })}
        
        <button
          onClick={onAddWordClick}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors duration-200 touch-manipulation text-primary bg-primary/10 hover:bg-primary/20"
        >
          <Plus className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium text-center leading-tight">{t("nav.add")}</span>
        </button>
      </div>
    </div>
  );
}