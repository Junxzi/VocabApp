import { Client } from "@notionhq/client";

// Initialize Notion client (will be configured when secrets are provided)
export const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET || 'placeholder',
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl: string): string {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }
    throw Error("Failed to extract page ID from URL: " + pageUrl);
}

export const NOTION_PAGE_ID = process.env.NOTION_PAGE_URL ? 
    extractPageIdFromUrl(process.env.NOTION_PAGE_URL) : 
    'placeholder';

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 */
export async function getNotionDatabases() {
    if (!process.env.NOTION_INTEGRATION_SECRET || !process.env.NOTION_PAGE_URL) {
        throw new Error("Notion integration not configured. Please provide NOTION_INTEGRATION_SECRET and NOTION_PAGE_URL.");
    }

    const childDatabases = [];
    
    try {
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: NOTION_PAGE_ID,
                start_cursor: startCursor,
            });

            for (const block of response.results) {
                if (block.type === "child_database") {
                    const databaseId = block.id;

                    try {
                        const databaseInfo = await notion.databases.retrieve({
                            database_id: databaseId,
                        });
                        childDatabases.push(databaseInfo);
                    } catch (error) {
                        console.error(`Error retrieving database ${databaseId}:`, error);
                    }
                }
            }

            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return childDatabases;
    } catch (error) {
        console.error("Error listing child databases:", error);
        throw error;
    }
}

/**
 * Find a Notion database with the matching title
 */
export async function findDatabaseByTitle(title: string) {
    const databases = await getNotionDatabases();

    for (const db of databases) {
        if (db.title && Array.isArray(db.title) && db.title.length > 0) {
            const dbTitle = db.title[0]?.plain_text?.toLowerCase() || "";
            if (dbTitle === title.toLowerCase()) {
                return db;
            }
        }
    }

    return null;
}

/**
 * Create a new database if one with a matching title does not exist
 */
export async function createDatabaseIfNotExists(title: string, properties: any) {
    const existingDb = await findDatabaseByTitle(title);
    if (existingDb) {
        return existingDb;
    }
    
    return await notion.databases.create({
        parent: {
            type: "page_id",
            page_id: NOTION_PAGE_ID
        },
        title: [
            {
                type: "text",
                text: {
                    content: title
                }
            }
        ],
        properties
    });
}

/**
 * Setup the Categories database in Notion
 */
export async function setupCategoriesDatabase() {
    return await createDatabaseIfNotExists("VocabMaster Categories", {
        Name: {
            title: {}
        },
        DisplayName: {
            rich_text: {}
        },
        Description: {
            rich_text: {}
        },
        Color: {
            rich_text: {}
        },
        Icon: {
            rich_text: {}
        },
        IsDefault: {
            checkbox: {}
        },
        SortOrder: {
            number: {}
        },
        Status: {
            select: {
                options: [
                    { name: "Active", color: "green" },
                    { name: "Draft", color: "yellow" },
                    { name: "Archived", color: "red" }
                ]
            }
        }
    });
}

/**
 * Get all categories from Notion Categories database
 */
export async function getCategoriesFromNotion() {
    try {
        const categoriesDb = await findDatabaseByTitle("VocabMaster Categories");
        if (!categoriesDb) {
            throw new Error("Categories database not found in Notion");
        }

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
                    property: "SortOrder",
                    direction: "ascending"
                }
            ]
        });

        return response.results.map((page: any) => {
            const properties = page.properties;
            
            return {
                notionId: page.id,
                name: properties.Name?.title?.[0]?.plain_text || "",
                displayName: properties.DisplayName?.rich_text?.[0]?.plain_text || "",
                description: properties.Description?.rich_text?.[0]?.plain_text || "",
                color: properties.Color?.rich_text?.[0]?.plain_text || "",
                icon: properties.Icon?.rich_text?.[0]?.plain_text || "",
                isDefault: properties.IsDefault?.checkbox || false,
                sortOrder: properties.SortOrder?.number || 0,
            };
        });
    } catch (error) {
        console.error("Error fetching categories from Notion:", error);
        throw new Error("Failed to fetch categories from Notion");
    }
}

/**
 * Create default categories in Notion if they don't exist
 */
export async function createDefaultCategories() {
    const categoriesDb = await setupCategoriesDatabase();
    
    const defaultCategories = [
        {
            name: "Academic",
            displayName: "Academic",
            description: "Academic and scholarly vocabulary",
            color: "#3B82F6",
            icon: "🎓",
            isDefault: true,
            sortOrder: 1
        },
        {
            name: "Business",
            displayName: "Business",
            description: "Business and professional terminology",
            color: "#059669",
            icon: "💼",
            isDefault: true,
            sortOrder: 2
        },
        {
            name: "Daily Life",
            displayName: "Daily Life",
            description: "Everyday conversation and common words",
            color: "#DC2626",
            icon: "🏠",
            isDefault: true,
            sortOrder: 3
        },
        {
            name: "Technical",
            displayName: "Technical",
            description: "Technical and specialized vocabulary",
            color: "#7C3AED",
            icon: "⚙️",
            isDefault: true,
            sortOrder: 4
        },
        {
            name: "TOEFL",
            displayName: "TOEFL",
            description: "TOEFL test preparation vocabulary",
            color: "#EA580C",
            icon: "📚",
            isDefault: true,
            sortOrder: 5
        }
    ];

    for (const category of defaultCategories) {
        try {
            await notion.pages.create({
                parent: {
                    database_id: categoriesDb.id
                },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: category.name
                                }
                            }
                        ]
                    },
                    DisplayName: {
                        rich_text: [
                            {
                                text: {
                                    content: category.displayName
                                }
                            }
                        ]
                    },
                    Description: {
                        rich_text: [
                            {
                                text: {
                                    content: category.description
                                }
                            }
                        ]
                    },
                    Color: {
                        rich_text: [
                            {
                                text: {
                                    content: category.color
                                }
                            }
                        ]
                    },
                    Icon: {
                        rich_text: [
                            {
                                text: {
                                    content: category.icon
                                }
                            }
                        ]
                    },
                    IsDefault: {
                        checkbox: category.isDefault
                    },
                    SortOrder: {
                        number: category.sortOrder
                    },
                    Status: {
                        select: {
                            name: "Active"
                        }
                    }
                }
            });
            
            console.log(`Created category: ${category.name}`);
        } catch (error) {
            console.log(`Category ${category.name} might already exist, skipping...`);
        }
    }
}