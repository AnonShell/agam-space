CREATE TABLE "invite_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_by" varchar NOT NULL,
	"email" varchar(255),
	"max_uses" integer DEFAULT 1 NOT NULL,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_invite_codes_expires_at" ON "invite_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_invite_codes_created_by" ON "invite_codes" USING btree ("created_by");