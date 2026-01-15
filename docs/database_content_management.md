# Database Content Management

This document explains how to manage memories and routine schedules in the database.

## Schema Overview

### Memories Table
Stores images and captions for the camera roll section on the landing page.

**Columns:**
- `id` (uuid, primary key)
- `src` (text) - Path to the image file
- `caption` (text) - Description text
- `sort_order` (integer) - Controls display order (ascending)
- `is_active` (boolean) - Show/hide from landing page
- `created_at`, `updated_at` (timestamps)

### Routine Schedules Table
Stores the weekly run schedule information.

**Columns:**
- `id` (uuid, primary key)
- `day` (text) - Day of the week
- `time` (text) - Start time
- `location` (text) - Meeting location
- `accent_color` (text) - CSS color variable for UI accent
- `description` (text) - Activity description
- `sort_order` (integer) - Controls display order (ascending)
- `is_active` (boolean) - Show/hide from landing page
- `created_at`, `updated_at` (timestamps)

## Running Migrations

To apply the schema and seed data to your database:

```bash
# Push changes to database
npm run db:push

# Or run migrations explicitly
npm run db:migrate
```

## Manual Data Management

### Adding a Memory

```sql
INSERT INTO memories (src, caption, sort_order, is_active)
VALUES ('/path/to/image.jpg', 'Your caption here', 10, true);
```

### Adding a Routine Schedule

```sql
INSERT INTO routine_schedules (day, time, location, accent_color, description, sort_order, is_active)
VALUES ('Friday', '06:00 AM', 'Waterfront Park', 'var(--accent-lime)', 'Easy Friday Run', 4, true);
```

### Updating Content

```sql
-- Update a memory caption
UPDATE memories
SET caption = 'New caption', updated_at = NOW()
WHERE id = 'your-uuid-here';

-- Update a routine schedule
UPDATE routine_schedules
SET time = '06:30 AM', updated_at = NOW()
WHERE day = 'Saturday';
```

### Hiding/Showing Content

```sql
-- Hide a memory without deleting
UPDATE memories SET is_active = false WHERE id = 'your-uuid-here';

-- Show it again
UPDATE memories SET is_active = true WHERE id = 'your-uuid-here';
```

### Reordering Content

```sql
-- Change display order
UPDATE memories SET sort_order = 5 WHERE id = 'your-uuid-here';
UPDATE routine_schedules SET sort_order = 2 WHERE id = 'your-uuid-here';
```

## Future: Admin Dashboard

These tables are designed to be managed through an admin dashboard where you can:
- Upload new images for memories
- Edit captions and descriptions
- Drag-and-drop to reorder items
- Toggle visibility with a switch
- Update schedule details

The `is_active` flag allows you to hide content without deleting it, and `sort_order` makes it easy to control the display order.

## Data Loading

The landing page (`src/routes/+page.svelte`) automatically loads active memories and routine schedules from the database, ordered by `sort_order`. This happens server-side in `src/routes/+page.server.ts`.

Only items where `is_active = true` are displayed on the site.
