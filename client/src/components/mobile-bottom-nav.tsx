import { Link, useLocation } from "wouter";
import { Home, BookOpen, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onAddWordClick: () => void;
}

export function MobileBottomNav({ onAddWordClick }: MobileBottomNavProps) {
  const [location] = useLocation();

  const navItems = [
    { label: "Vocabulary", href: "/", icon: Home },
    { label: "Study", href: "/study", icon: BookOpen },
    { label: "Progress", href: "/progress", icon: TrendingUp },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-inset-bottom z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors duration-200 touch-manipulation",
                isActive
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        <button
          onClick={onAddWordClick}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors duration-200 touch-manipulation text-foreground bg-primary"
        >
          <Plus className="w-5 h-5 mb-1 text-primary-foreground" />
          <span className="text-xs font-medium text-primary-foreground">Add</span>
        </button>
      </div>
    </div>
  );
}