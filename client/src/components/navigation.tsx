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
    { label: t("nav.progress"), href: "/progress" },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 safe-area-inset-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-lg md:text-xl font-bold text-foreground">{t("nav.title")}</h1>
            </div>
            <div className="hidden md:flex space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "font-medium transition-colors duration-200 hover:text-foreground",
                    location === item.href
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger className="w-16 h-8 p-0 border-none bg-transparent">
                <Globe className="w-4 h-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="ja">日本</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onImportClick} variant="outline" size="sm" className="font-medium hidden sm:flex">
              <Upload className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">{t("nav.import")}</span>
            </Button>
            <Button onClick={onAddWordClick} size="sm" className="font-medium">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t("nav.add")}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-3 py-3 font-medium transition-colors duration-200 rounded-md touch-manipulation",
                  location === item.href
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-border pt-2 mt-2 space-y-1">
              <button
                onClick={() => {
                  onImportClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-3 font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors duration-200 touch-manipulation"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import APKG
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
