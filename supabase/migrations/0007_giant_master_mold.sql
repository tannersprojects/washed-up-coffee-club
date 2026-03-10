CREATE TYPE "public"."landing_copy_key" AS ENUM('manifesto.eyebrow', 'manifesto.headline', 'manifesto.description', 'manifesto.vibe_label', 'manifesto.vibe_quote');--> statement-breakpoint
CREATE TYPE "public"."landing_copy_section" AS ENUM('manifesto');--> statement-breakpoint
CREATE TABLE "landing_copy" (
	"key" "landing_copy_key" PRIMARY KEY NOT NULL,
	"section" "landing_copy_section" NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO landing_copy (key, section, label, value, sort_order) VALUES
  ('manifesto.eyebrow',     'manifesto', 'Section Eyebrow', 'The Split', 0),
  ('manifesto.headline',    'manifesto', 'Headline', 'We do hard things. We just prefer to do them together.', 1),
  ('manifesto.description', 'manifesto', 'Description', 'Washed Up Coffee Club is more than just miles. We are a community of friends pushing each other to be our best selves. We celebrate the PRs, support through the injuries, and find joy in the shared struggle of a hard workout.', 2),
  ('manifesto.vibe_label',  'manifesto', 'Vibe Label', 'CURRENT VIBE', 3),
  ('manifesto.vibe_quote',  'manifesto', 'Vibe Quote', 'The miles don''t get easier. The support just gets stronger.', 4);
