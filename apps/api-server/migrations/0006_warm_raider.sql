CREATE INDEX "files_user_parent_namehash_idx" ON "files" USING btree ("user_id","parent_id","name_hash");--> statement-breakpoint
CREATE INDEX "files_user_status_idx" ON "files" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "folders_user_parent_namehash_idx" ON "folders" USING btree ("user_id","parent_id","name_hash");--> statement-breakpoint
CREATE INDEX "folders_user_status_idx" ON "folders" USING btree ("user_id","status");