CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"color" text,
	"icon" text,
	"is_default" integer DEFAULT 0,
	"sort_order" integer DEFAULT 0,
	"notion_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_notion_id_unique" UNIQUE("notion_id")
);
--> statement-breakpoint
CREATE TABLE "daily_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"completed_at" timestamp,
	"total_words" integer DEFAULT 0,
	"correct_words" integer DEFAULT 0,
	"accuracy" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_challenges_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vocabulary_words" (
	"id" serial PRIMARY KEY NOT NULL,
	"word" text NOT NULL,
	"pronunciation" text DEFAULT '',
	"pronunciation_us" text,
	"pronunciation_uk" text,
	"pronunciation_au" text,
	"part_of_speech" text,
	"definition" text NOT NULL,
	"example_sentences" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"difficulty" integer,
	"study_count" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"ease_factor" numeric(3, 2) DEFAULT '2.5',
	"interval" integer DEFAULT 1,
	"next_review" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_studied" timestamp,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vocabulary_words" ADD CONSTRAINT "vocabulary_words_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;