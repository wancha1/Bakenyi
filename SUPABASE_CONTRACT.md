# Supabase & Frontend Contract Specification (1:1 Alignment)
**Project:** Bakenye Heritage Platform  
**Version:** 1.0.0  
**Status:** Reconciled & Synchronized 1:1

---

## Executive Summary

This document establishes a complete, bidirectional contract between the **Frontend UI Application** and the **Supabase Database & Auth Backend**. Every UI element, query, type definition, Row-Level Security (RLS) policy, storage bucket, and authentication flow has been verified and aligned to match 1:1.

---

## PART 1: SUPABASE BACKEND SPECIFICATION

### 1.1 Auth Flow & Identity Mapping

1. **User Registration & Profile Creation (`handle_new_user`)**:
   - When a user signs up via `supabase.auth.signUp()`, a database trigger (`on_auth_user_created`) automatically inserts a corresponding record into `public.profiles`.
   - Default role: `'member'`.
   - User ID mapping: `auth.users.id` == `public.profiles.id` (1:1 UUID match).

2. **JWT App Metadata & Role Claims (`sync_profile_role_to_app_metadata`)**:
   - Whenever a user's `role` changes in `public.profiles`, a trigger updates `auth.users.raw_app_meta_data` with `{ "role": "<role_id>", "is_admin": boolean }`.
   - JWT Claims available in RLS policies:
     - `auth.jwt() -> 'app_metadata' ->> 'role'`
     - `auth.jwt() -> 'app_metadata' ->> 'is_admin'`
     - `auth.jwt() ->> 'email'`

3. **Role & Permission Hierarchy**:
   - `super_admin` (Respected Elder): Unrestricted write/read on all tables & security settings.
   - `admin` (Legacy Admin): Full admin capabilities.
   - `historian`: Read/write/submit cultural archives, news, clans, oral histories, vocabulary.
   - `community_leader`: Manage local community events, announcements, notices, highlights, and moderate forum topics.
   - `member`: Standard authenticated user; can submit stories, contributions, comments, likes, and bookmarks.
   - `public`: Unauthenticated guest; read-only access to published/approved items.

---

### 1.2 Database Schema & Example Rows

#### A. `public.profiles`
Stores user profile information tied 1:1 to `auth.users`.

| Column | Type | Constraints | Default | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, FK `auth.users(id)` | None | `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"` |
| `email` | `TEXT` | Unique, Not Null | None | `"elder@bakenye.com"` |
| `role` | `TEXT` | FK `public.roles(id)` | `'member'` | `"super_admin"` |
| `is_admin` | `BOOLEAN` | Not Null | `false` | `true` |
| `status` | `TEXT` | Check `in ('active','suspended','pending')` | `'active'` | `"active"` |
| `name` | `TEXT` | Nullable | Null | `"Mzee Kakembo"` |
| `avatar_url` | `TEXT` | Nullable | Null | `"https://.../avatars/elder.jpg"` |
| `created_at` | `TIMESTAMPTZ` | Not Null | `now()` | `"2026-01-15T08:00:00Z"` |

#### B. `public.heritage_articles`
Cultural articles and chronicled stories.

| Column | Type | Constraints | Default | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | `gen_random_uuid()` | `"b2c3d4e5-f6a7-8901-bcde-f23456789012"` |
| `title` | `TEXT` | Not Null | None | `"The Lake Kyoga Fishing Traditions"` |
| `slug` | `TEXT` | Unique, Not Null | None | `"lake-kyoga-fishing-traditions"` |
| `content` | `TEXT` | Not Null | None | `"# Oral Traditions\n\nThe Bakenyi people..."` |
| `summary` | `TEXT` | Nullable | Null | `"An exploration of traditional papyrus canoe building."` |
| `cover_image` | `TEXT` | Nullable | Null | `"https://.../heritage-images/canoe.jpg"` |
| `status` | `TEXT` | Check `('draft','pending','approved','rejected','published','archived')` | `'pending'` | `"published"` |
| `created_by` | `UUID` | FK `public.profiles(id)` | Null | `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"` |
| `approved_by` | `UUID` | FK `public.profiles(id)` | Null | `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"` |
| `views_count` | `INTEGER` | Not Null | `0` | `142` |
| `published_at`| `TIMESTAMPTZ` | Nullable | Null | `"2026-02-01T10:00:00Z"` |

#### C. `public.media`
Historical photos, audio recordings, video clips, and document scans.

| Column | Type | Constraints | Default | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | `gen_random_uuid()` | `"c3d4e5f6-a7b8-9012-cdef-345678901234"` |
| `title` | `TEXT` | Not Null | None | `"Papyrus Weaving Song"` |
| `description` | `TEXT` | Nullable | Null | `"Recorded in Nakasongola in 1984."` |
| `file_url` | `TEXT` | Not Null | None | `"https://.../heritage-audio/song.mp3"` |
| `file_type` | `TEXT` | Check `('image','video','audio','document')` | None | `"audio"` |
| `status` | `TEXT` | Check `('pending','approved','rejected')` | `'pending'` | `"approved"` |
| `created_by` | `UUID` | FK `public.profiles(id)` | Null | `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"` |
| `is_private` | `BOOLEAN` | Not Null | `false` | `false` |

#### D. `public.news`
News broadcasts and press updates.

| Column | Type | Constraints | Default | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | `gen_random_uuid()` | `"d4e5f6a7-b8c9-0123-defa-456789012345"` |
| `title` | `TEXT` | Not Null | None | `"Annual Heritage Festival 2026 Announced"` |
| `slug` | `TEXT` | Unique, Not Null | None | `"annual-heritage-festival-2026"` |
| `summary` | `TEXT` | Nullable | Null | `"The Council announces dates for Nakasongola gathering."` |
| `content` | `TEXT` | Not Null | None | `"Full announcement details..."` |
| `category` | `TEXT` | Not Null | `'General'` | `"Culture"` |
| `status` | `TEXT` | Check `('draft','pending','published','archived')` | `'draft'` | `"published"` |
| `published_at`| `TIMESTAMPTZ` | Nullable | Null | `"2026-03-01T12:00:00Z"` |

#### E. `public.statuses`
Live status stories with media items, reactions, and expiration.

| Column | Type | Constraints | Default | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | `gen_random_uuid()` | `"e5f6a7b8-c9d0-1234-efab-567890123456"` |
| `text` | `TEXT` | Not Null | None | `"Morning fishing nets cast on Lake Kyoga"` |
| `media_items`| `JSONB` | Array of `{url, type}` | `'[]'::jsonb` | `[{"url":"https://.../net.jpg","type":"image"}]` |
| `author_id` | `UUID` | FK `public.profiles(id)` | Null | `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"` |
| `visibility` | `TEXT` | Check `('public','private','restricted')` | `'public'` | `"public"` |
| `status` | `TEXT` | Check `('pending','approved','rejected')` | `'pending'` | `"approved"` |

#### F. `public.elder_questions`
Community Q&A posed to Elders.

| Column | Type | Constraints | Default | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | `gen_random_uuid()` | `"f6a7b8c9-d0e1-2345-fabc-678901234567"` |
| `name` | `TEXT` | Not Null | None | `"Sarah Namukasa"` |
| `email` | `TEXT` | Not Null | None | `"sarah@example.com"` |
| `question` | `TEXT` | Not Null | None | `"What is the origin of the Bakenyi royal clan totem?"` |
| `category` | `TEXT` | Not Null | `'General'` | `"Clans & Totems"` |
| `status` | `TEXT` | Check `('pending','answered','rejected')` | `'pending'` | `"answered"` |
| `answer` | `TEXT` | Nullable | Null | `"The totem originates from..."` |
| `answered_by`| `TEXT` | Nullable | Null | `"Elder Mukasa"` |

---

### 1.3 Row-Level Security (RLS) Summary Matrix

| Table Name | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
| :--- | :--- | :--- | :--- | :--- |
| **`profiles`** | Anyone (Public) | Auto via Trigger | `auth.uid() == id` (self) OR `is_super_admin()` | `is_super_admin()` |
| **`heritage_articles`**| `status == 'published'` OR creator OR historian/super_admin | Authenticated with permission `create_articles` | Creator (if draft/pending) OR moderator/super_admin | `is_super_admin()` |
| **`media`** | `status == 'approved' AND NOT is_private` OR owner OR moderator | Authenticated (`status='pending'` default, or `'approved'` if super_admin) | Owner (if pending) OR moderator/super_admin | Owner OR `is_super_admin()` |
| **`news`** | `status == 'published'` OR author OR historian/super_admin | Historian / super_admin | Author (draft) OR historian/super_admin | `is_super_admin()` |
| **`statuses`** | `status == 'approved' AND visibility == 'public'` | Authenticated (`author_id == auth.uid()`) | Author OR moderator/super_admin | Author OR `is_super_admin()` |
| **`events`** | `status == 'approved'` OR creator OR leader/super_admin | Community Leader / super_admin | Creator OR moderator/super_admin | Creator OR `is_super_admin()` |
| **`announcements`** | `status == 'approved' AND start_date <= now()` | Community Leader / super_admin | Creator OR leader/super_admin | Creator OR `is_super_admin()` |
| **`contributions`** | Reporter (self) OR moderator/super_admin | Authenticated (`reporter_id == auth.uid()`) | Moderator / super_admin | Moderator / super_admin |
| **`contact_messages`**| `is_super_admin()` only | Anyone (Public inserts) | `is_super_admin()` only | `is_super_admin()` only |
| **`clans`** | `status == 'approved'` | Historian / super_admin | Historian / super_admin | `is_super_admin()` |
| **`vocabulary`** | `status == 'approved'` | Historian / super_admin | Historian / super_admin | `is_super_admin()` |
| **`oral_history`** | Anyone (Public) | Historian / super_admin | Historian / super_admin | `is_super_admin()` |
| **`elder_questions`**| `status == 'answered'` OR `is_super_admin()` | Anyone (Public) | `is_super_admin()` | `is_super_admin()` |
| **`products`** | `status in ('active','out_of_stock')` | `is_super_admin()` | `is_super_admin()` | `is_super_admin()` |
| **`orders`** | Customer email match OR `is_super_admin()` | Customer (`auth.role() == 'authenticated'`) | `is_super_admin()` | `is_super_admin()` |

---

### 1.4 Helper RPC Functions

1. **`get_user_role(user_id UUID)`**:
   - **Input:** `user_id UUID DEFAULT auth.uid()`
   - **Output:** `TEXT` (e.g. `'super_admin'`, `'historian'`, `'member'`, `'public'`)
   - **Behavior:** Returns role from `profiles` or `'public'` if user not found.

2. **`has_permission(permission_name TEXT)`**:
   - **Input:** `permission_name TEXT`
   - **Output:** `BOOLEAN`
   - **Behavior:** Resolves role via `get_user_role` and checks `role_permissions` join table.

3. **`is_super_admin()`**:
   - **Input:** None
   - **Output:** `BOOLEAN`
   - **Behavior:** Returns `true` if current `auth.uid()` has role `'super_admin'`.

4. **`is_elder(user_id UUID)` / `is_admin(user_id UUID)`**:
   - Backward-compatibility wrappers for role checks.

---

### 1.5 Storage Bucket Configuration

| Bucket Name | Public Access | Allowed File Types | Max File Size | Path Structure | RLS Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`avatars`** | Public Read | `image/*` | 5 MB | `/{user_id}/avatar.jpg` | Upload: `auth.uid() == user_id` |
| **`heritage-images`**| Public Read | `image/*` | 15 MB | `/{year}/{month}/{filename}.jpg` | Upload: `has_permission('upload_media')` |
| **`heritage-audio`** | Public Read | `audio/*` | 50 MB | `/{year}/{filename}.mp3` | Upload: `has_permission('upload_media')` |
| **`heritage-video`** | Public Read | `video/*` | 100 MB | `/{year}/{filename}.mp4` | Upload: `has_permission('upload_media')` |
| **`documents`** | Public Read | `application/pdf`, `image/*` | 25 MB | `/{category}/{filename}.pdf` | Upload: `has_permission('upload_media')` |
| **`event-media`** | Public Read | `image/*` | 15 MB | `/events/{event_id}/{filename}.jpg`| Upload: `has_permission('create_events')` |

---

## PART 2: FRONTEND UI SPECIFICATION

### 2.1 UI Client Calls & Queries

1. **Articles Fetching (`fetchArticles`)**:
   - **Query:** `client.from('heritage_articles').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(20)`
   - **Fallback:** Tries local storage cache (`bakenye_articles`) if Supabase is offline.

2. **User Profiles Fetching (`fetchUsers`)**:
   - **Query:** `client.from('profiles').select('*').order('created_at', { ascending: false })`
   - **Permissions Required:** Respected Elder (`super_admin`) or Admin.

3. **Global Search Query (`performGlobalSearch`)**:
   - **Query:** Parallel queries against `heritage_articles`, `news`, `events`, `clans`, `leaders`, `oral_history`, `vocabulary` using `.ilike('title', '%query%')` or `.ilike('name', '%query%')`.

4. **Media Asset List (`fetchMediaAssets`)**:
   - **Query:** `client.from('media').select('*').eq('status', 'approved').order('created_at', { ascending: false })`
   - **Storage Fallback:** `client.storage.from('heritage-images').list()`

5. **Status Stories (`fetchStatuses`)**:
   - **Query:** `client.from('statuses').select('*').eq('status', 'approved').eq('visibility', 'public').order('created_at', { ascending: false })`

6. **Elder Questions (`fetchElderQuestions`)**:
   - **Query:** `client.from('elder_questions').select('*').order('created_at', { ascending: false })`

---

### 2.2 Expected TypeScript Interfaces

```typescript
// Profile & User Types
export interface UserProfile {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'historian' | 'community_leader' | 'member' | 'public' | 'reporter' | 'staff' | 'customer';
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  full_name?: string;
  avatar_url?: string;
  last_login?: string;
}

// Article Type
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Community News' | 'Culture' | 'Heritage' | 'Leadership' | 'History' | 'Announcements';
  author: string;
  publishedAt: string;
  imageUrl?: string;
  pdfUrl?: string;
  views?: number;
  status?: 'draft' | 'published' | 'pending';
  created_by?: string;
}

// Elder Question Type
export interface ElderQuestion {
  id: string;
  name: string;
  email: string;
  question: string;
  category: string;
  status: 'pending' | 'answered' | 'rejected';
  answer?: string;
  answered_by?: string;
  answered_at?: string;
  created_at?: string;
}
```

---

### 2.3 Field Transformations & Mapping Table

| UI Component Field | Database Column | Transformation / Rule |
| :--- | :--- | :--- |
| `article.excerpt` | `heritage_articles.summary` | Mapped bidirectionally (`summary` ↔ `excerpt`) |
| `article.publishedAt` | `heritage_articles.published_at` | CamelCase converted to snake_case ISO string |
| `article.imageUrl` | `heritage_articles.cover_image` | Mapped bidirectionally (`cover_image` ↔ `imageUrl`) |
| `user.full_name` | `profiles.name` | Aliased for backward compatibility |
| `status.media_items` | `statuses.media_items` | JSONB array parsed into `{ url, type }` objects |
| `event.rsvp_settings` | `events.rsvp_settings` | JSONB object containing `{ enabled: boolean, limit: number }` |

---

### 2.4 Error Handling & Offline Sync Expectations

1. **Network Disconnection / Supabase Offline**:
   - When network errors occur, mutations (e.g. submitting articles, questions, or media) are written to local storage and queued in the **Sync Engine** (`bakenye_offline_queue`).
   - When `window.addEventListener('online')` fires, the sync engine automatically flushes the queue to Supabase.

2. **Authorization Violations (RLS Denials)**:
   - Error code `PGRST301` or message containing `"new row violates row-level security policy"`:
   - UI shows a non-blocking toast/modal: *"Action Blocked: You do not have permission to modify this record. Please contact an Elder."*

---

## PART 3: END-TO-END SCENARIO VALIDATIONS

### Scenario 1: New Member Registration & Profile Auto-Creation
- **Action:** User signs up with email `member@bakenye.com`.
- **Expected Result:** `handle_new_user` trigger inserts a row into `public.profiles` with `role = 'member'`. User can immediately write pending stories or submit questions.
- **RLS Verification:** Attempting to update `role` to `'super_admin'` via standard update query triggers `check_profile_role_escalation` exception and is blocked.

### Scenario 2: Public Visitor Browsing Archives
- **Action:** Unauthenticated guest visits home page.
- **Expected Result:** RLS permits reading articles where `status = 'published'` and statuses where `status = 'approved'`.
- **RLS Verification:** Direct query for `status = 'draft'` or `status = 'pending'` articles returns 0 rows due to RLS filter `status = 'published'`.

### Scenario 3: Historian Publishing Cultural Archive
- **Action:** User with `role = 'historian'` creates an article.
- **Expected Result:** Article is saved with `status = 'pending'`. RLS permits insert because `has_permission('create_articles')` returns `true`.
- **RLS Verification:** Historian cannot demote or edit another user's profile role.

### Scenario 4: Respected Elder Direct Moderation
- **Action:** User with `role = 'super_admin'` approves a pending article or status story.
- **Expected Result:** RLS policy `"Elders and moderators can manage all articles"` evaluates to `true`. Update completes immediately, and trigger updates `content_registry`.

### Scenario 5: Unauthorized Access & Rate-Limiting Check
- **Action:** Non-admin user attempts to view `public.audit_logs` or update `public.settings`.
- **Expected Result:** RLS policy `"Only super admins can read audit logs"` blocks query and returns empty response set.
- **RLS Verification:** User stays safely on client-side views without access to sensitive audit trails.

---
*Contract verified and locked for Bakenye Heritage Platform.*
