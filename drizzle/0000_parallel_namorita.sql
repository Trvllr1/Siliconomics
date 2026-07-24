CREATE TABLE "alert_acks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_id" uuid NOT NULL,
	"rule_id" text NOT NULL,
	"acknowledged" boolean DEFAULT true NOT NULL,
	"acknowledged_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "build_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"creator_id" text NOT NULL,
	"creator_name" text NOT NULL,
	"organization" text DEFAULT '' NOT NULL,
	"parent_id" uuid,
	"status" text DEFAULT 'Draft' NOT NULL,
	"version" text DEFAULT 'v1.0' NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"portfolio" text DEFAULT '' NOT NULL,
	"reference_model" text DEFAULT '' NOT NULL,
	"formula_version" text DEFAULT 'Murphy-SIA-v4.2' NOT NULL,
	"design_model" jsonb NOT NULL,
	"architecture" jsonb,
	"data_vintage" jsonb,
	"frozen_at" timestamp,
	"content_hash" text,
	"deleted_at" timestamp,
	"created_date" timestamp DEFAULT now() NOT NULL,
	"updated_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_id" uuid NOT NULL,
	"element_id" text,
	"author_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_role" text NOT NULL,
	"content" text NOT NULL,
	"version_stamp" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_archetypes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"archetype" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_ids" jsonb NOT NULL,
	"outcome" text NOT NULL,
	"approver_id" text NOT NULL,
	"approver_name" text NOT NULL,
	"rationale" text NOT NULL,
	"follow_up_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"owner_id" text NOT NULL,
	"build_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"persona" text DEFAULT 'executive' NOT NULL,
	"onboarding_step" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alert_acks" ADD CONSTRAINT "alert_acks_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_acks" ADD CONSTRAINT "alert_acks_acknowledged_by_id_users_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_events" ADD CONSTRAINT "build_events_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_events" ADD CONSTRAINT "build_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builds" ADD CONSTRAINT "builds_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_archetypes" ADD CONSTRAINT "custom_archetypes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE no action ON UPDATE no action;