import { Link, useLocation } from "wouter";
import { Home, BookOpen, TrendingUp, Shuffle, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

export function MobileBottomNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { label: t("nav.vocabulary"), href: "/", icon: Home },
    { label: t("nav.study"), href: "/study", icon: BookOpen },
    { label: t("nav.progress"), href: "/progress", icon: TrendingUp },
  ];

  const scrollToTop = () => {
    // For vocabulary page (homepage), use instant scroll for faster navigation
    // For other pages, use smooth scroll
    const behavior = location === "/" ? 'auto' : 'smooth';
    window.scrollTo({ 
      top: 0, 
      behavior: behavior
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/40 safe-area-inset-bottom z-50 md:hidden">
      <div className="flex items-center py-1 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  scrollToTop();
                }
              }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-colors duration-200 touch-manipulation min-h-[44px]",
                isActive
                  ? "text-foreground bg-muted/80"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
            </Link>
          );
        })}
        


        {/* Settings on the far right */}
        <Link
          href="/settings"
          onClick={(e) => {
            if (location === "/settings") {
              e.preventDefault();
              scrollToTop();
            }
          }}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-colors duration-200 touch-manipulation min-h-[44px]",
            location === "/settings"
              ? "text-foreground bg-muted/80"
              : "text-muted-foreground"
          )}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium text-center leading-tight">{t("nav.settings")}</span>
        </Link>
      </div>
    </div>
  );
}