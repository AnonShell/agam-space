CREATE TABLE "public_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"item_id" text NOT NULL,
	"item_type" text NOT NULL,
	"server_share_key" text NOT NULL,
	"wrapped_item_key" text NOT NULL,
	"salt" text,
	"password_hash" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public_shares" ADD CONSTRAINT "public_shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_shares_owner_idx" ON "public_shares" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "public_shares_item_idx" ON "public_shares" USING btree ("item_id");