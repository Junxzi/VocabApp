
import { Client } from "@notionhq/client";

const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET,
});

const NOTION_PAGE_ID = extractPageId(process.env.NOTION_PAGE_URL || "");

function extractPageId(pageUrl: string): string {
    const match = pageUrl.match(/([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    return match ? match[0].replace(/-/g, '') : '';
}

async function findDatabaseByTitle(title: string) {
    try {
        const response = await notion.search({
            query: title,
            filter: {
                value: "database",
                property: "object"
            }
        });

        return response.results.find((result: any) => 
            result.title?.[0]?.plain_text === title
        ) as any;
    } catch (error) {
        console.error("Error searching for database:", error);
        return null;
    }
}

async function cleanupDuplicateCategories() {
    console.log("🧹 Starting cleanup of duplicate categories...");
    
    try {
        const categoriesDb = await findDatabaseByTitle("VocabMaster Categories");
        if (!categoriesDb) {
            console.log("❌ Categories database not found");
            return;
        }

        // Get all categories
        const response = await notion.databases.query({
            database_id: categoriesDb.id,
            filter: {
                property: "Status",
                select: {
                    equals: "Active"
                }
            },
            sorts: [
                {
                    property: "Name",
                    direction: "ascending"
                },
                {
                    timestamp: "created_time",
                    direction: "ascending"
                }
            ]
        });

        // Group by category name
        const categoryGroups: { [key: string]: any[] } = {};
        
        response.results.forEach((page: any) => {
            const name = page.properties.Name?.title?.[0]?.plain_text || "";
            if (!categoryGroups[name]) {
                categoryGroups[name] = [];
            }
            categoryGroups[name].push(page);
        });

        // Delete duplicates (keep the first one, delete the rest)
        for (const [categoryName, pages] of Object.entries(categoryGroups)) {
            if (pages.length > 1) {
                console.log(`Found ${pages.length} duplicates of "${categoryName}"`);
                
                // Keep the first one, delete the rest
                for (let i = 1; i < pages.length; i++) {
                    try {
                        await notion.pages.update({
                            page_id: pages[i].id,
                            properties: {
                                Status: {
                                    select: {
                                        name: "Archived"
                                    }
                                }
                            }
                        });
                        console.log(`  ✓ Archived duplicate: ${categoryName} (${i})`);
                    } catch (error) {
                        console.error(`  ✗ Failed to archive duplicate: ${categoryName}`, error);
                    }
                }
            } else {
                console.log(`○ No duplicates found for: ${categoryName}`);
            }
        }

        console.log("✅ Cleanup completed!");
        
    } catch (error) {
        console.error("❌ Cleanup failed:", error);
    }
}

// Run cleanup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    cleanupDuplicateCategories().then(() => {
        console.log("Cleanup complete!");
        process.exit(0);
    }).catch(error => {
        console.error("Cleanup failed:", error);
        process.exit(1);
    });
}

export { cleanupDuplicateCategories };
