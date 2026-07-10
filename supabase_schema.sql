-- =========================================================================
--             BAKENYE HERITAGE PLATFORM - SUPABASE DATABASE SCHEMA
--                 Comprehensive Role-Based Access Control & Architecture
-- =========================================================================
-- This script sets up a highly secure, production-grade schema with strict 
-- Row-Level Security (RLS), custom security functions, automated trigger-based
-- profile creation, and dynamic JWT app_metadata syncing for seamless role checks.
--
-- INSTRUCTIONS:
-- Copy and run this script in the Supabase SQL Editor (https://supabase.com).
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CLEANUP (Safe Re-creation)
-- ==========================================
DROP TRIGGER IF EXISTS trigger_sync_profile_role_to_app_metadata ON public.profiles;
DROP TRIGGER IF EXISTS trigger_check_profile_role_escalation ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.sync_profile_role_to_app_metadata();
DROP FUNCTION IF EXISTS public.check_profile_role_escalation();
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.has_permission(text);
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.current_profile();

-- Drop existing tables to avoid conflicts and recreate clean schemas
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.discussions CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.media CASCADE;
DROP TABLE IF EXISTS public.heritage_articles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- ==========================================
-- 2. CREATE ROLE-BASED ACCESS TABLES
-- ==========================================

-- A. ROLES TABLE
CREATE TABLE public.roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- B. PERMISSIONS TABLE
CREATE TABLE public.permissions (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- C. ROLE_PERMISSIONS JOIN TABLE
CREATE TABLE public.role_permissions (
    role_id TEXT REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- D. PROFILES TABLE (Core Identity)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- E. CATEGORIES TABLE
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- F. HERITAGE ARTICLES TABLE (Wisdom & Story Submissions)
CREATE TABLE public.heritage_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    cover_image TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'archived')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ -- For soft delete support
);

-- G. MEDIA TABLE (Photos, Videos, Audios, Documents)
CREATE TABLE public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document')),
    category TEXT DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_private BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- H. EVENTS TABLE (Community Events, Calendars & RSVPs)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    cover_image TEXT,
    organizer TEXT NOT NULL,
    contact TEXT,
    capacity INTEGER CHECK (capacity > 0),
    rsvp_settings JSONB NOT NULL DEFAULT '{"enabled": false, "limit": null}'::jsonb,
    map_location JSONB NOT NULL DEFAULT '{"latitude": null, "longitude": null}'::jsonb,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- I. ANNOUNCEMENTS TABLE (Broadcast Priority Notices)
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'community', -- 'meetings', 'emergencies', 'ceremonies', etc.
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'emergency')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMPTZ,
    pinned BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- J. COMMENTS TABLE
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'discussion', 'media')),
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_text text NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- K. LIKES TABLE (Reactions Tracker)
CREATE TABLE public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'discussion', 'media')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_content_like UNIQUE (user_id, content_id, content_type)
);

-- L. BOOKMARKS TABLE (Private bookmarks)
CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'media')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_content_bookmark UNIQUE (user_id, content_id, content_type)
);

-- M. DISCUSSIONS TABLE (Elder Forum & Community Topics)
CREATE TABLE public.discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- N. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system', -- 'system', 'moderation', 'social', 'alert'
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- O. ACTIVITY LOGS (User audit log)
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- P. AUDIT LOGS (Security and system operations, read-only for anyone except super_admin)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Q. SETTINGS TABLE
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 2B. ADDITIONAL TABLES FOR COMPLETE SYNCHRONIZATION
-- ==========================================

-- 1. STATUSES TABLE
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    media_items JSONB DEFAULT '[]'::jsonb,
    link TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'restricted')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reactions JSONB DEFAULT '{}'::jsonb,
    comments JSONB DEFAULT '[]'::jsonb,
    expires_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved public statuses" 
    ON public.statuses FOR SELECT USING (status = 'approved' AND visibility = 'public' AND NOT is_archived);

CREATE POLICY "Authors can manage their own statuses" 
    ON public.statuses FOR ALL USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "Elders and moderators can manage all statuses" 
    ON public.statuses FOR ALL USING (public.is_super_admin() OR public.has_permission('approve_submissions'));


-- 2. NEWS TABLE
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'General',
    tags JSONB DEFAULT '[]'::jsonb,
    featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published news" 
    ON public.news FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage own news drafts" 
    ON public.news FOR ALL USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "Elders and historians can manage all news" 
    ON public.news FOR ALL USING (public.is_super_admin() OR public.get_user_role() = 'historian');


-- 3. CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store dynamic contribution data (desc, imageUrl, type, email)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contributions" 
    ON public.contributions FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Elders and moderators can view all contributions" 
    ON public.contributions FOR SELECT USING (public.is_super_admin() OR public.has_permission('approve_submissions'));

CREATE POLICY "Authenticated users can submit contributions" 
    ON public.contributions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

CREATE POLICY "Elders and moderators can manage contributions" 
    ON public.contributions FOR ALL USING (public.is_super_admin() OR public.has_permission('approve_submissions'));


-- 4. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'archived')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact messages" 
    ON public.contact_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Only Elders can view and manage contact messages" 
    ON public.contact_messages FOR ALL USING (public.is_super_admin());


-- 5. CLANS TABLE
CREATE TABLE IF NOT EXISTS public.clans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    totem TEXT NOT NULL,
    motto TEXT,
    "desc" TEXT, -- Store raw description
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    history TEXT,
    origin TEXT,
    leadership TEXT,
    custodian TEXT,
    gallery_urls JSONB DEFAULT '[]'::jsonb,
    document_urls JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved clans" 
    ON public.clans FOR SELECT USING (status = 'approved');

CREATE POLICY "Elders and historians can manage clans" 
    ON public.clans FOR ALL USING (public.is_super_admin() OR public.get_user_role() = 'historian');


-- 6. LEADERS TABLE
CREATE TABLE IF NOT EXISTS public.leaders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    role TEXT,
    bio TEXT,
    photo_url TEXT,
    expertise TEXT,
    clan TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved leaders" 
    ON public.leaders FOR SELECT USING (status = 'approved');

CREATE POLICY "Elders and leaders can manage leaders" 
    ON public.leaders FOR ALL USING (public.is_super_admin() OR public.get_user_role() = 'community_leader');


-- 7. VOCABULARY TABLE
CREATE TABLE IF NOT EXISTS public.vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lukenye TEXT UNIQUE NOT NULL,
    english TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    usage TEXT,
    audio_url TEXT,
    example_sentence TEXT,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved vocabulary" 
    ON public.vocabulary FOR SELECT USING (status = 'approved');

CREATE POLICY "Elders and historians can manage vocabulary" 
    ON public.vocabulary FOR ALL USING (public.is_super_admin() OR public.get_user_role() = 'historian');


-- 8. STORY CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.story_categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    fields JSONB DEFAULT '[]'::jsonb,
    validation_rules TEXT,
    upload_requirements TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.story_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active story categories" 
    ON public.story_categories FOR SELECT USING (NOT is_archived);

CREATE POLICY "Only Elders can manage story categories" 
    ON public.story_categories FOR ALL USING (public.is_super_admin());


-- 9. ORAL HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.oral_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    elder TEXT,
    narrator TEXT,
    clan TEXT,
    role TEXT,
    topic TEXT DEFAULT 'Tradition',
    duration TEXT,
    duration_seconds INTEGER DEFAULT 0,
    image_url TEXT,
    audio_url TEXT,
    recording_date TEXT,
    transcription JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.oral_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view oral history" 
    ON public.oral_history FOR SELECT USING (true);

CREATE POLICY "Elders and historians can manage oral history" 
    ON public.oral_history FOR ALL USING (public.is_super_admin() OR public.get_user_role() = 'historian');


-- 10. TIMELINE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period TEXT,
    year TEXT,
    title TEXT NOT NULL,
    "desc" TEXT, -- Store raw description
    description TEXT,
    year_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view timeline events" 
    ON public.timeline_events FOR SELECT USING (true);

CREATE POLICY "Elders and historians can manage timeline events" 
    ON public.timeline_events FOR ALL USING (public.is_super_admin() OR public.get_user_role() = 'historian');


-- 11. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    image_url TEXT,
    category TEXT DEFAULT 'General',
    stock INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'out_of_stock')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" 
    ON public.products FOR SELECT USING (status = 'active' OR status = 'out_of_stock');

CREATE POLICY "Elders can manage products" 
    ON public.products FOR ALL USING (public.is_super_admin());


-- 12. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    items_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" 
    ON public.orders FOR SELECT USING (customer_email = auth.jwt() ->> 'email');

CREATE POLICY "Elders can manage all orders" 
    ON public.orders FOR ALL USING (public.is_super_admin());


-- ==========================================
-- 3. SEED DEFAULT ROLES & PERMISSIONS DATA
-- ==========================================

-- Populate Roles
INSERT INTO public.roles (id, name, description) VALUES
('super_admin', 'Respected Elder', 'Full administrator privileges over entire system, content, role configuration, settings, and database.'),
('historian', 'Historian', 'Cultural expert authorized to create, edit, submit, and manage cultural archives, media, and articles.'),
('community_leader', 'Community Leader', 'Authorized to create local activities, publish community announcements, moderate discussion boards, and approve local submissions.'),
('member', 'Registered Member', 'Standard authenticated platform participant who can submit stories, upload items, participate in forum threads, comment, and like.'),
('public', 'Public Guest', 'Unauthenticated or anonymous visitor with read-only permissions for fully verified content.'),
('admin', 'Admin', 'Legacy role for administrator access.'),
('staff', 'Staff', 'Legacy role for staff access.'),
('customer', 'Customer', 'Legacy role for standard user / customer access.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Populate Permissions
INSERT INTO public.permissions (id, name, description) VALUES
('manage_users', 'Manage User Roles & Accounts', 'Change user roles, approve accounts, or suspend users.'),
('approve_submissions', 'Moderate and Approve Content', 'Review, publish, reject, or request changes on pending articles/gallery submissions.'),
('create_articles', 'Create Cultural Articles & Stories', 'Compose wisdom entries and chronicled articles.'),
('upload_media', 'Upload Historical Media Assets', 'Submit raw photography, document scans, or oral history files.'),
('create_events', 'Manage Calendar Events', 'Propose or list events, workshops, or ceremonies.'),
('publish_announcements', 'Publish Community Broadcasts', 'Manage priorities, pinnings, and emergency notices.'),
('moderate_discussions', 'Moderate Forums & Comments', 'Lock threads, edit/delete messages, and handle flags.'),
('view_analytics', 'View System Traffic & Metrics', 'Access reporting panels, visitor counts, and counts.'),
('view_audit_logs', 'View System Security Audit Trail', 'Read critical database and server change tracking logs.'),
('manage_settings', 'Modify System Configurations', 'Configure API endpoints, bucket policies, and layouts.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Populate Role-Permission Association
-- Super Admin (Elders) get EVERYTHING
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'super_admin', id FROM public.permissions;

-- Historians
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('historian', 'create_articles'),
('historian', 'upload_media');

-- Community Leaders
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('community_leader', 'create_events'),
('community_leader', 'publish_announcements'),
('community_leader', 'moderate_discussions'),
('community_leader', 'approve_submissions');

-- Members
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('member', 'upload_media');

-- Legacy Roles Permissions Seed
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'admin', id FROM public.permissions ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'staff', id FROM public.permissions WHERE id IN ('approve_submissions', 'create_articles', 'upload_media', 'create_events', 'publish_announcements', 'moderate_discussions') ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'customer', id FROM public.permissions WHERE id IN ('create_articles', 'upload_media') ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. RECURSION-SAFE SECURITY AUTH HELPERS
-- ==========================================

-- Helper A: Get role of a user
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role FROM public.profiles WHERE id = user_id),
        'public'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper B: Check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(permission_name text)
RETURNS boolean AS $$
DECLARE
    user_role text;
    has_perm boolean;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    user_role := public.get_user_role(auth.uid());
    
    SELECT EXISTS (
        SELECT 1 
        FROM public.role_permissions 
        WHERE role_id = user_role AND permission_id = permission_name
    ) INTO has_perm;

    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper C: Check if current user is super_admin (Respected Elder)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
    RETURN public.get_user_role(auth.uid()) = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper D: Get profile data for the current authenticated user
CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS SETOF public.profiles AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.profiles WHERE id = auth.uid() LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Legacy Compatibility functions to keep frontend code running perfectly
CREATE OR REPLACE FUNCTION public.is_elder(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role = 'super_admin' AND status = 'active' FROM public.profiles WHERE id = user_id),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role IN ('super_admin', 'community_leader') AND status = 'active' FROM public.profiles WHERE id = user_id),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_reporter(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role IN ('super_admin', 'historian', 'community_leader') AND status = 'active' FROM public.profiles WHERE id = user_id),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==========================================
-- 5. AUTOMATIC TRIGGERS (PROFILES & TOKEN COHESION)
-- ==========================================

-- Trigger A: Automatically register a Profile when an Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, is_admin, status)
    VALUES (
        new.id,
        new.email,
        'member', -- STRICT DEFAULT: All signups enter as Member role by default
        false,
        'active'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger B: Securely block profile updates attempting role-escalation
CREATE OR REPLACE FUNCTION public.check_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent users from self-promoting or bypassing account suspension
    IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.is_admin IS DISTINCT FROM NEW.is_admin OR OLD.status IS DISTINCT FROM NEW.status) THEN
        IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Unauthorized escalation attempt: Only Respected Elders can edit user roles, admin privileges, or statuses.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_check_profile_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.check_profile_role_escalation();

-- Trigger C: Automatically sync role update to Supabase auth app_metadata for secure JWT claims
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_app_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'role', new.role, 
            'is_admin', COALESCE(new.role IN ('super_admin', 'community_leader'), false)
        )
    WHERE id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_sync_profile_role_to_app_metadata
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_app_metadata();


-- ==========================================
-- 6. ENABLE ROW-LEVEL SECURITY (RLS) ON ALL TABLES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heritage_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 7. DEFINE SECURE RLS POLICIES FOR TABLES
-- ==========================================

-- 7A. PROFILES POLICIES
CREATE POLICY "Profiles can be read by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own metadata" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Elders can do everything on profiles" 
    ON public.profiles FOR ALL USING (public.is_super_admin());


-- 7B. CATEGORIES POLICIES
CREATE POLICY "Anyone can view categories" 
    ON public.categories FOR SELECT USING (true);

CREATE POLICY "Only Elders and Leaders can manage categories" 
    ON public.categories FOR ALL 
    USING (public.has_permission('manage_settings'))
    WITH CHECK (public.has_permission('manage_settings'));


-- 7C. HERITAGE ARTICLES POLICIES
CREATE POLICY "Public can read published articles" 
    ON public.heritage_articles FOR SELECT 
    USING (status = 'published' AND deleted_at IS NULL);

CREATE POLICY "Writers can read their own draft/pending articles" 
    ON public.heritage_articles FOR SELECT 
    USING (created_by = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Historians and Leaders can read all articles" 
    ON public.heritage_articles FOR SELECT 
    USING (public.has_permission('approve_submissions') OR public.get_user_role() = 'historian');

CREATE POLICY "Authorized users can create articles" 
    ON public.heritage_articles FOR INSERT 
    WITH CHECK (
        public.has_permission('create_articles')
        AND created_by = auth.uid()
        AND (
            -- Regular historians insert as pending draft
            (status IN ('draft', 'pending') AND NOT public.is_super_admin())
            -- Elders can publish instantly
            OR (status = 'published' AND public.is_super_admin())
        )
    );

CREATE POLICY "Creators can update own pending articles" 
    ON public.heritage_articles FOR UPDATE 
    USING (created_by = auth.uid() AND status IN ('draft', 'pending'))
    WITH CHECK (created_by = auth.uid() AND status IN ('draft', 'pending'));

CREATE POLICY "Elders and moderators can manage all articles" 
    ON public.heritage_articles FOR UPDATE 
    USING (public.has_permission('approve_submissions') OR public.is_super_admin());


-- 7D. MEDIA POLICIES
CREATE POLICY "Anyone can view approved public media" 
    ON public.media FOR SELECT 
    USING (status = 'approved' AND NOT is_private);

CREATE POLICY "Owners can view their own media" 
    ON public.media FOR SELECT 
    USING (created_by = auth.uid());

CREATE POLICY "Moderators can view all media" 
    ON public.media FOR SELECT 
    USING (public.has_permission('approve_submissions'));

CREATE POLICY "Authenticated users can upload media" 
    ON public.media FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated'
        AND created_by = auth.uid()
        AND (
            (status = 'pending' AND NOT public.is_super_admin())
            OR (status = 'approved' AND public.is_super_admin())
        )
    );

CREATE POLICY "Owners can edit own pending media" 
    ON public.media FOR UPDATE 
    USING (created_by = auth.uid() AND status = 'pending');

CREATE POLICY "Elders and moderators can manage all media" 
    ON public.media FOR UPDATE 
    USING (public.has_permission('approve_submissions') OR public.is_super_admin());


-- 7E. EVENTS POLICIES
CREATE POLICY "Public can view approved events" 
    ON public.events FOR SELECT USING (status = 'approved');

CREATE POLICY "Creators can view own events" 
    ON public.events FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Leaders and Elders can manage all events" 
    ON public.events FOR SELECT USING (public.has_permission('create_events'));

CREATE POLICY "Authorized users can insert events" 
    ON public.events FOR INSERT 
    WITH CHECK (
        public.has_permission('create_events')
        AND created_by = auth.uid()
    );

CREATE POLICY "Authorized users can update events" 
    ON public.events FOR UPDATE 
    USING (
        created_by = auth.uid()
        OR public.has_permission('approve_submissions')
        OR public.is_super_admin()
    );


-- 7F. ANNOUNCEMENTS POLICIES
CREATE POLICY "Anyone can view approved active announcements" 
    ON public.announcements FOR SELECT 
    USING (
        status = 'approved'
        AND start_date <= timezone('utc'::text, now())
        AND (end_date IS NULL OR end_date >= timezone('utc'::text, now()))
    );

CREATE POLICY "Creators can see own announcements" 
    ON public.announcements FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Leaders and Elders can see all announcements" 
    ON public.announcements FOR SELECT USING (public.has_permission('publish_announcements'));

CREATE POLICY "Authorized users can insert announcements" 
    ON public.announcements FOR INSERT 
    WITH CHECK (
        public.has_permission('publish_announcements')
        AND created_by = auth.uid()
    );

CREATE POLICY "Authorized users can manage announcements" 
    ON public.announcements FOR UPDATE 
    USING (
        created_by = auth.uid()
        OR public.has_permission('publish_announcements')
        OR public.is_super_admin()
    );


-- 7G. COMMENTS POLICIES
CREATE POLICY "Anyone can see approved comments" 
    ON public.comments FOR SELECT USING (status = 'approved');

CREATE POLICY "Authors can see own comments" 
    ON public.comments FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Authenticated users can comment" 
    ON public.comments FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated'
        AND author_id = auth.uid()
    );

CREATE POLICY "Authors can edit own comments" 
    ON public.comments FOR UPDATE 
    USING (author_id = auth.uid() AND status = 'approved');

CREATE POLICY "Moderators can moderate comments" 
    ON public.comments FOR UPDATE 
    USING (public.has_permission('moderate_discussions') OR public.is_super_admin());


-- 7H. LIKES POLICIES
CREATE POLICY "Likes are publicly readable" 
    ON public.likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like/unlike" 
    ON public.likes FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 7I. BOOKMARKS POLICIES
CREATE POLICY "Users can only read own bookmarks" 
    ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can toggle own bookmarks" 
    ON public.bookmarks FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 7J. DISCUSSIONS POLICIES
CREATE POLICY "Anyone can view discussions" 
    ON public.discussions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussions" 
    ON public.discussions FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated'
        AND author_id = auth.uid()
    );

CREATE POLICY "Creators can update own discussions if not locked" 
    ON public.discussions FOR UPDATE 
    USING (author_id = auth.uid() AND NOT is_locked);

CREATE POLICY "Leaders and Elders can manage discussions fully" 
    ON public.discussions FOR ALL 
    USING (public.has_permission('moderate_discussions') OR public.is_super_admin());


-- 7K. NOTIFICATIONS POLICIES
CREATE POLICY "Users can only manage their own notifications" 
    ON public.notifications FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 7L. ACTIVITY LOGS POLICIES
CREATE POLICY "Users can read their own logs" 
    ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can append activity logs" 
    ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Elders can read all activity logs" 
    ON public.activity_logs FOR SELECT USING (public.is_super_admin());


-- 7M. AUDIT LOGS POLICIES (Strictly super_admin only!)
CREATE POLICY "Only super admins can read audit logs" 
    ON public.audit_logs FOR SELECT USING (public.is_super_admin());


-- 7N. SETTINGS POLICIES
CREATE POLICY "Anyone can read system settings" 
    ON public.settings FOR SELECT USING (true);

CREATE POLICY "Only super admins can modify settings" 
    ON public.settings FOR ALL 
    USING (public.is_super_admin());


-- ==========================================
-- 8. STORAGE BUCKET & POLICIES SETUP
-- ==========================================
-- Insert standard media buckets securely
INSERT INTO storage.buckets (id, name, public) VALUES
('avatars', 'avatars', true),
('heritage-images', 'heritage-images', true),
('heritage-videos', 'heritage-videos', true),
('documents', 'documents', true),
('event-media', 'event-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Enablement & Policies
CREATE POLICY "Public Read for avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Upload own avatar" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public Read for heritage-images" ON storage.objects FOR SELECT USING (bucket_id = 'heritage-images');
CREATE POLICY "Upload heritage images" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'heritage-images' AND public.has_permission('upload_media'));

CREATE POLICY "Public Read for heritage-videos" ON storage.objects FOR SELECT USING (bucket_id = 'heritage-videos');
CREATE POLICY "Upload heritage videos" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'heritage-videos' AND public.has_permission('upload_media'));

CREATE POLICY "Public Read for documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Upload heritage documents" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'documents' AND public.has_permission('upload_media'));

CREATE POLICY "Public Read for event-media" ON storage.objects FOR SELECT USING (bucket_id = 'event-media');
CREATE POLICY "Upload event media" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'event-media' AND public.has_permission('create_events'));


-- ==========================================
-- 9. PERFORMANCE INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

CREATE INDEX IF NOT EXISTS idx_heritage_articles_created_by ON public.heritage_articles(created_by);
CREATE INDEX IF NOT EXISTS idx_heritage_articles_status ON public.heritage_articles(status);
CREATE INDEX IF NOT EXISTS idx_heritage_articles_slug ON public.heritage_articles(slug);

CREATE INDEX IF NOT EXISTS idx_media_created_by ON public.media(created_by);
CREATE INDEX IF NOT EXISTS idx_media_status ON public.media(status);

CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start_datetime);

CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);

CREATE INDEX IF NOT EXISTS idx_comments_content ON public.comments(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_likes_content ON public.likes(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE NOT is_read;

-- ==========================================
-- 10. SUCCESS BROADCAST
-- ==========================================
SELECT 'Bakenye Heritage Platform Database Schema configured successfully!' AS status;
