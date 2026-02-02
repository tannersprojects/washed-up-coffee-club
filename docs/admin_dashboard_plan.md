# Admin Dashboard Plan

## Overview

The admin dashboard will provide a centralized interface for managing all aspects of the Washed Up Coffee Club application, with a primary focus on challenge management, content updates, and user administration.

## Core Functionalities

### 1. Challenge Management

#### Draft Challenges System

**Concept**: Separate challenges into draft and published states using a dedicated drafts table or status flag.

**Option A: Separate Table Approach**
- Create `challenge_drafts` table with same schema as `challenges`
- Benefits:
  - Clean separation between live and draft content
  - Can test/preview drafts without affecting live data
  - Easy to discard drafts without touching production data
- Migration flow:
  - Admin creates challenge in `challenge_drafts`
  - On publish, data is copied to `challenges` table
  - Draft is either deleted or marked as "published"

**Option B: Status Flag Approach**
- Add `draft_status` enum to existing `challenges` table: `draft`, `pending_review`, `published`
- Benefits:
  - Single source of truth
  - Easier to promote draft to live (just update status)
  - Can track revision history in one place
- Considerations:
  - Need to ensure drafts don't show in public queries
  - RLS policies must filter out drafts for non-admins

**Recommended**: Option B with status flag, as it's simpler and allows for future workflow states like "pending_review" or "archived".

#### Challenge Builder Interface

Features:
- **Form Builder**:
  - Title, description input
  - Challenge type selector (cumulative, best_effort, segment_race)
  - Date range picker for start/end dates
  - Goal value input with unit selector (meters for distance, seconds for time)
  - Segment ID selector (with Strava segment search/integration?)
  - Status toggle (upcoming, active, completed)
  
- **Preview Mode**:
  - Live preview of how the challenge will look on the dashboard
  - Preview with mock leaderboard data
  
- **Validation**:
  - Ensure start date < end date
  - Validate goal value is appropriate for challenge type
  - Check for overlapping challenges (optional warning)

- **Actions**:
  - Save as Draft
  - Publish (moves to active/upcoming)
  - Schedule Publish (publish at specific date/time)
  - Clone Challenge (duplicate existing for quick setup)

#### Challenge Lifecycle Management

- **Edit Published Challenges**:
  - Allow edits to description, end date (extend deadlines)
  - Restrict edits to critical fields once challenge is active (type, start date)
  - Show warning if edits affect participants
  
- **Archive Challenges**:
  - Move completed challenges to "archived" state
  - Keep data for historical records but hide from main views
  
- **Delete Challenges**:
  - Soft delete option (mark as deleted but keep data)
  - Hard delete for drafts only
  - Cascade rules for participants and contributions

### 2. Content Management

#### Memories Section
- **CRUD Operations**:
  - Upload new photos
  - Edit captions
  - Reorder via drag-and-drop (update `sortOrder`)
  - Toggle `isActive` to show/hide
  - Bulk actions (activate/deactivate multiple)
  
- **Image Management**:
  - Upload to Supabase Storage
  - Image optimization/compression
  - Preview before publish

#### Routine Schedules
- **Manage Weekly Runs**:
  - Add/edit/remove schedule entries
  - Update day, time, location
  - Choose accent color (color picker)
  - Reorder schedules via drag-and-drop
  - Toggle active/inactive

### 3. User Management

#### User Profiles
- **View All Users**:
  - List with search/filter (by name, role, Strava connection status)
  - Sort by join date, last activity
  
- **User Details**:
  - View profile information
  - See Strava connection status
  - View challenge participation history
  - See contribution statistics

- **Role Management**:
  - Promote user to admin
  - Demote admin to user
  - Audit log of role changes

- **User Actions**:
  - Manually disconnect Strava (in case of issues)
  - View user's activities/contributions
  - Remove user from specific challenge (if needed)

### 4. Challenge Participation Management

#### Monitor Participation
- **Participant List per Challenge**:
  - View all participants for each challenge
  - See registration date, status, current result
  - Sort by performance, join date
  
- **Manual Actions**:
  - Manually add user to challenge (for special cases)
  - Remove user from challenge
  - Adjust participant status (registered → completed, DNF, etc.)
  - Edit result values (for corrections/disputes)

#### Contribution Management
- **View Contributions**:
  - See all activities counting toward a challenge
  - Filter by user, date, validity
  
- **Validation**:
  - Mark contribution as invalid/valid (for disputes)
  - Manually add contribution (if sync failed)
  - Remove invalid contribution
  
- **Bulk Recalculation**:
  - Trigger recalculation of all results for a challenge
  - Useful after making data corrections

### 5. Analytics & Reporting

#### Challenge Analytics
- **Per-Challenge Stats**:
  - Total participants
  - Active vs inactive participants
  - Completion rate
  - Average distance/time
  - Daily participation graph
  - Top performers
  
- **Historical Trends**:
  - Compare challenges over time
  - Participation trends by month/season
  - Popular challenge types

#### User Analytics
- **Engagement Metrics**:
  - Total registered users
  - Active users (participated in last 30/60/90 days)
  - Strava connection rate
  - Average challenges per user
  
- **Activity Metrics**:
  - Total contributions tracked
  - Total distance/time logged
  - Most active users

### 6. Strava Integration Management

#### Webhook Management
- **Monitor Webhook Status**:
  - View webhook subscription status
  - Test webhook delivery
  - View recent webhook events log
  
- **Manual Sync**:
  - Trigger manual activity sync for specific user
  - Bulk sync for all users (admin override)
  - View sync errors/logs

#### Activity Processing
- **Failed Activities**:
  - View activities that failed to process
  - Retry processing
  - Manual intervention options

### 7. System Administration

#### Configuration
- **Feature Flags**:
  - Toggle features on/off without deployment
  - Beta features for testing
  
- **Site Settings**:
  - Maintenance mode toggle
  - Announcement banner (global message)
  - Contact information updates

#### Audit Logs
- **Track Admin Actions**:
  - Log all admin operations (who, what, when)
  - Challenge modifications
  - User role changes
  - Data corrections
  
- **Security**:
  - View login history
  - Track failed authorization attempts

## Database Schema Additions

### Challenge Drafts (Option A)
```sql
CREATE TABLE challenge_drafts (
  -- Same schema as challenges table
  -- Plus:
  created_by UUID REFERENCES profile(id),
  published_challenge_id UUID REFERENCES challenges(id), -- if this draft came from editing a published challenge
  last_modified TIMESTAMP DEFAULT NOW()
);
```

### Challenge Status Enhancement (Option B - Recommended)
```sql
-- Add to challenges table
ALTER TABLE challenges 
  ADD COLUMN draft_status TEXT DEFAULT 'published',
  ADD COLUMN created_by UUID REFERENCES profile(id),
  ADD COLUMN last_modified_by UUID REFERENCES profile(id),
  ADD COLUMN last_modified_at TIMESTAMP DEFAULT NOW();

CREATE TYPE draft_status_enum AS ENUM ('draft', 'pending_review', 'published', 'archived');
```

### Admin Audit Log
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profile(id),
  action TEXT NOT NULL, -- 'create_challenge', 'edit_challenge', 'change_user_role', etc.
  entity_type TEXT NOT NULL, -- 'challenge', 'user', 'contribution', etc.
  entity_id UUID,
  details JSONB, -- Store relevant change details
  created_at TIMESTAMP DEFAULT NOW()
);
```

## UI/UX Considerations

### Navigation Structure
```
Admin Dashboard
├── Overview (stats, recent activity)
├── Challenges
│   ├── All Challenges (published)
│   ├── Drafts
│   ├── Archived
│   └── Create New
├── Content
│   ├── Memories
│   └── Routine Schedules
├── Users
│   ├── All Users
│   └── Role Management
├── Analytics
│   ├── Challenge Stats
│   └── User Engagement
└── System
    ├── Strava Integration
    ├── Settings
    └── Audit Logs
```

### Access Control
- Only users with `role = 'admin'` can access admin dashboard
- Use RLS policies to enforce admin-only access to sensitive operations
- Add admin check middleware to all admin routes

### Design Principles
- Keep consistent with main app design (coffee club aesthetic)
- Mobile-responsive admin interface
- Quick actions/shortcuts for common tasks
- Confirmation dialogs for destructive actions
- Toast notifications for action feedback

## Implementation Priority

### Phase 1: Core Challenge Management (MVP)
1. Challenge CRUD with draft status
2. Basic challenge builder interface
3. Publish/unpublish functionality
4. Admin-only route protection

### Phase 2: Content Management
1. Memories CRUD
2. Routine schedules CRUD
3. Image upload to Supabase Storage

### Phase 3: User & Participation Management
1. User list and details
2. Role management
3. Participant list per challenge
4. Manual participant actions

### Phase 4: Analytics & Advanced Features
1. Challenge analytics dashboard
2. User engagement metrics
3. Audit logging
4. Strava integration management

## Technical Notes

- **Authentication**: Leverage existing Supabase auth, check `session.user.role === 'admin'`
- **Routes**: Create `/admin` route group with admin layout
- **RLS**: Ensure all admin tables have proper RLS policies
- **API**: Consider server actions vs API routes for admin operations
- **Validation**: Use Zod schemas for form validation
- **State Management**: Could use similar pattern to dashboard (context + UI classes)

## Future Enhancements

- **Scheduled Challenges**: Auto-activate challenges at specified times (cron job/scheduled function)
- **Email Notifications**: Admin can send announcements to all users or specific groups
- **Challenge Templates**: Save challenge configurations as templates for reuse
- **Bulk Operations**: Import/export challenges via CSV/JSON
- **Advanced Permissions**: Multiple admin roles (super admin, content editor, moderator)
- **Version History**: Track changes to challenges over time
- **A/B Testing**: Test different challenge formats/messaging
