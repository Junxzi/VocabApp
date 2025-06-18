import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, Plus, Upload, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, type Language } from "@/lib/i18n";

interface NavigationProps {
  onAddWordClick: () => void;
  onImportClick: () => void;
}

export function Navigation({ onAddWordClick, onImportClick }: NavigationProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const navigationItems = [
    { label: t("nav.vocabulary"), href: "/" },
    { label: t("nav.study"), href: "/study" },
    { label: "Swipe Study", href: "/swipe-study" },
    { label: t("nav.progress"), href: "/progress" },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur-lg border-b border-border/40 sticky top-0 z-50 safe-area-inset-top shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-18 md:h-20">
          <div className="flex items-center space-x-4 md:space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{t("nav.title")}</h1>
            </div>
            <div className="hidden md:flex space-x-10">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-lg font-medium transition-all duration-300 hover:text-foreground hover:scale-105 px-3 py-2 rounded-lg",
                    location === item.href
                      ? "text-foreground bg-muted/50"
                      : "text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3 md:space-x-5">
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger className="w-20 h-10 p-2 border border-border/50 bg-background/50 rounded-lg hover:bg-muted/50 transition-colors">
                <Globe className="w-5 h-5" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="ja">日本</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onImportClick} variant="outline" size="lg" className="font-medium hidden sm:flex h-10 px-4 rounded-lg border-border/50 hover:bg-muted/50 transition-all duration-200">
              <Upload className="w-5 h-5 mr-2" />
              <span className="hidden md:inline text-base">{t("nav.import")}</span>
            </Button>
            <Button onClick={onAddWordClick} size="lg" className="font-medium h-10 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
              <Plus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline text-base">{t("nav.add")}</span>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="md:hidden p-3 rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border/40">
          <div className="px-6 py-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-4 py-3 rounded-lg text-lg font-medium transition-all duration-300 hover:scale-[1.02] touch-manipulation",
                  location === item.href
                    ? "text-foreground bg-muted/50 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-border/40 pt-4 mt-4 space-y-2">
              <button
                onClick={() => {
                  onImportClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 rounded-lg text-lg font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-300 hover:scale-[1.02] touch-manipulation"
              >
                <Upload className="w-5 h-5 mr-3" />
                {t("nav.import")}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
