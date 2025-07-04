import { db } from "./db";
import { categories } from "@shared/schema";
import { eq } from "drizzle-orm";

// 🔒 Notion連携が未設定のため一時的にコメントアウト
// import { 
//   getCategoriesFromNotion,
//   createDefaultCategories,
//   setupCategoriesDatabase,
//   setupVocabularyDatabase,
//   getVocabularyWordsFromNotion
// } from "./notion";

/**
 * Initialize default categories in the database
 */
async function initializeDefaultCategories() {
  const defaultCategories = [
    {
      name: "Academic",
      displayName: "Academic",
      description: "Academic and scholarly vocabulary",
      color: "#3B82F6",
      icon: "🎓",
      isDefault: 1,
      sortOrder: 1
    },
    {
      name: "Business",
      displayName: "Business",
      description: "Business and professional terminology",
      color: "#059669",
      icon: "💼",
      isDefault: 1,
      sortOrder: 2
    },
    {
      name: "Daily Life",
      displayName: "Daily Life",
      description: "Everyday conversation and common words",
      color: "#DC2626",
      icon: "🏠",
      isDefault: 1,
      sortOrder: 3
    },
    {
      name: "Technical",
      displayName: "Technical",
      description: "Technical and specialized vocabulary",
      color: "#7C3AED",
      icon: "⚙️",
      isDefault: 1,
      sortOrder: 4
    },
    {
      name: "TOEFL",
      displayName: "TOEFL",
      description: "TOEFL test preparation vocabulary",
      color: "#EA580C",
      icon: "📚",
      isDefault: 1,
      sortOrder: 5
    }
  ];

  console.log("Initializing default categories...");

  for (const category of defaultCategories) {
    try {
      const existing = await db.select().from(categories).where(eq(categories.name, category.name));
      if (existing.length === 0) {
        await db.insert(categories).values(category);
        console.log(`✓ Created category: ${category.name}`);
      } else {
        console.log(`○ Category already exists: ${category.name}`);
      }
    } catch (error) {
      console.error(`✗ Failed to create category ${category.name}:`, error);
    }
  }
}

// 🔒 以下 Notion連携処理（未使用のためコメントアウト）
// async function syncCategoriesFromNotion() { /* ... */ }
// async function syncVocabularyWordsFromNotion() { /* ... */ }
// 

/**
 * Main setup function
 */
async function setupCategories() {
  console.log("=== Category Setup (Local Only) ===");

  try {
    await initializeDefaultCategories();

    // 🔒 Notion連携を再開する場合は以下の行をアンコメント
    // await setupCategoriesDatabase();
    // await createDefaultCategories();
    // await syncCategoriesFromNotion();
    // await setupVocabularyDatabase();
    // await syncVocabularyWordsFromNotion();

    const allCategories = await db.select().from(categories);
    console.log("\n📋 Final category list:");
    allCategories.forEach((cat) => {
      console.log(`  ${cat.icon || "📄"} ${cat.displayName} (${cat.name})`);
    });

    console.log("\n✅ Category setup completed successfully!");
  } catch (error) {
    console.error("❌ Category setup failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupCategories()
    .then(() => {
      console.log("Setup complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Setup failed:", error);
      process.exit(1);
    });
}

export { setupCategories, initializeDefaultCategories };

// 🔒 Notion未設定のため、ダミー関数で抑止中
export async function syncCategoriesFromNotion() {
  console.log("🛑 syncCategoriesFromNotion is disabled");
}
export async function syncVocabularyWordsFromNotion() {
  console.log("🛑 syncVocabularyWordsFromNotion is disabled");
}