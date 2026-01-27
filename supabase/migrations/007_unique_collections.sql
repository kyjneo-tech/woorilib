-- Add unique constraint to collections to enable safe upserts
ALTER TABLE collections ADD CONSTRAINT collections_publisher_title_key UNIQUE (publisher, title);
