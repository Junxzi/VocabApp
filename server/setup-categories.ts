import { db } from "./db";
import { categories } from "@shared/schema";
import { getCategoriesFromNotion, createDefaultCategories, setupCategoriesDatabase } from "./notion";
import { eq } from "drizzle-orm";

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
            // Check if category already exists
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

/**
 * Sync categories from Notion to database
 */
async function syncCategoriesFromNotion() {
    if (!process.env.NOTION_INTEGRATION_SECRET || !process.env.NOTION_PAGE_URL) {
        console.log("⚠ Notion integration not configured - skipping Notion sync");
        return;
    }

    try {
        console.log("Setting up Notion categories database...");
        await setupCategoriesDatabase();
        
        console.log("Creating default categories in Notion...");
        await createDefaultCategories();
        
        console.log("Syncing categories from Notion to database...");
        const notionCategories = await getCategoriesFromNotion();
        
        for (const notionCategory of notionCategories) {
            try {
                // Check if category exists by notion ID or name
                const existing = await db.select().from(categories)
                    .where(eq(categories.notionId, notionCategory.notionId));
                
                if (existing.length > 0) {
                    // Update existing category
                    await db.update(categories)
                        .set({
                            displayName: notionCategory.displayName,
                            description: notionCategory.description,
                            color: notionCategory.color,
                            icon: notionCategory.icon,
                            sortOrder: notionCategory.sortOrder,
                            updatedAt: new Date()
                        })
                        .where(eq(categories.notionId, notionCategory.notionId));
                    console.log(`✓ Updated category: ${notionCategory.name}`);
                } else {
                    // Create new category
                    await db.insert(categories).values({
                        name: notionCategory.name,
                        displayName: notionCategory.displayName,
                        description: notionCategory.description,
                        color: notionCategory.color,
                        icon: notionCategory.icon,
                        isDefault: notionCategory.isDefault ? 1 : 0,
                        sortOrder: notionCategory.sortOrder,
                        notionId: notionCategory.notionId
                    });
                    console.log(`✓ Created category from Notion: ${notionCategory.name}`);
                }
            } catch (error) {
                console.error(`✗ Failed to sync category ${notionCategory.name}:`, error);
            }
        }
        
        console.log("✓ Notion categories sync completed");
    } catch (error) {
        console.error("✗ Failed to sync from Notion:", error);
        console.log("Falling back to default categories only");
    }
}

/**
 * Main setup function
 */
async function setupCategories() {
    console.log("=== Category Management Setup ===");
    
    try {
        // Always initialize default categories first
        await initializeDefaultCategories();
        
        // Try to sync from Notion if configured
        await syncCategoriesFromNotion();
        
        // Display final category list
        const allCategories = await db.select().from(categories);
        console.log("\n📋 Final category list:");
        allCategories.forEach(cat => {
            console.log(`  ${cat.icon || '📄'} ${cat.displayName} (${cat.name})`);
        });
        
        console.log("\n✅ Category setup completed successfully!");
        
    } catch (error) {
        console.error("❌ Category setup failed:", error);
        process.exit(1);
    }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupCategories().then(() => {
        console.log("Setup complete!");
        process.exit(0);
    }).catch(error => {
        console.error("Setup failed:", error);
        process.exit(1);
    });
}

export { setupCategories, initializeDefaultCategories, syncCategoriesFromNotion };