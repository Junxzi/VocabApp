
export const APP_CONFIG = {
  NAME: "VocabMaster",
  DESCRIPTION: "Learn English vocabulary with pronunciation guides and study modes",
  VERSION: "1.0.0",
  PORT: 5000,
  DEFAULT_STUDY_LIMIT: 10,
  DEFAULT_REVIEW_LIMIT: 50,
  MAX_DIFFICULTY: 4,
  MIN_DIFFICULTY: 1,
} as const;

export const ROUTES = {
  HOME: "/",
  VOCABULARY: "/",
  WORD_DETAIL: "/word/:id",
  SWIPE_STUDY: "/swipe-study",
  PROGRESS: "/progress",
  SETTINGS: "/settings",
} as const;

export const API_ENDPOINTS = {
  VOCABULARY: "/api/vocabulary",
  CATEGORIES: "/api/categories",
  ADMIN_SETUP: "/api/admin/setup-categories",
  ADMIN_CLEANUP: "/api/admin/cleanup-duplicates",
} as const;

export const CATEGORIES = [
  { name: "Academic", displayName: "Academic", color: "#3B82F6", icon: "GraduationCap" },
  { name: "Business", displayName: "Business", color: "#10B981", icon: "Briefcase" },
  { name: "Daily Life", displayName: "Daily Life", color: "#F59E0B", icon: "Home" },
  { name: "Technical", displayName: "Technical", color: "#8B5CF6", icon: "Cpu" },
  { name: "TOEFL", displayName: "TOEFL", color: "#EF4444", icon: "BookOpen" },
] as const;

export const STUDY_MODES = {
  SWIPE: "swipe",
  LIST: "list",
  REVIEW: "review",
} as const;

export const DIFFICULTY_LEVELS = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  VERY_HARD: 4,
} as const;

export const PWA_CONFIG = {
  THEME_COLOR: "#000000",
  BACKGROUND_COLOR: "#ffffff",
  DISPLAY: "standalone",
  ORIENTATION: "portrait",
} as const;
