import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  onAddWordClick: () => void;
  onImportClick: () => void;
}

export function Navigation({ onAddWordClick, onImportClick }: NavigationProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { label: "Vocabulary", href: "/" },
    { label: "Study Mode", href: "/study" },
    { label: "Progress", href: "/progress" },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-foreground">VocabMaster</h1>
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
          <div className="flex items-center space-x-4">
            <Button onClick={onImportClick} variant="outline" className="font-medium">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={onAddWordClick} className="font-medium">
              <Plus className="w-4 h-4 mr-2" />
              Add Word
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-4 h-4" />
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
                  "block px-3 py-2 font-medium transition-colors duration-200",
                  location === item.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
