-- =========================================================================
--             BAKENYI HERITAGE PORTAL - SUPABASE DATABASE SCHEMA
--                 Aligning Database to Secure Frontend Roles
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
-- 1. CLEANUP (Optional / Safe Re-creation)
-- ==========================================
DROP TRIGGER IF EXISTS trigger_sync_profile_role_to_app_metadata ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.sync_profile_role_to_app_metadata();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_elder(uuid);
DROP FUNCTION IF EXISTS public.is_reporter(uuid);
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- ==========================================
-- 2. CREATE CORE TABLES
-- ==========================================

-- A. PROFILES TABLE (Core Identity & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer', -- 'super_admin' (Elder), 'admin' (Admin), 'reporter' (Staff), 'customer' (Public)
    is_admin BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'pending'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- B. ARTICLES TABLE (Chronicled Wisdom & Submissions)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'published', 'archived'
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    published_at TIMESTAMPTZ
);

-- C. CONTRIBUTIONS TABLE (Community Submissions)
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- JSON string or metadata block containing contribution details
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- D. GALLERY TABLE (Media Gallery)
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'All',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- E. CONTACT MESSAGES TABLE (Support and Queries)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'replied'
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- F. CLANS TABLE (Bakenyi Clans & Totems)
CREATE TABLE IF NOT EXISTS public.clans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    totem TEXT NOT NULL,
    motto TEXT,
    desc TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    history TEXT,
    origin TEXT,
    leadership TEXT,
    custodian TEXT,
    gallery_urls TEXT DEFAULT '[]', -- JSON array of image URLs
    document_urls TEXT DEFAULT '[]', -- JSON array of PDF/doc URLs
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- G. LEADERS TABLE (Elders Council & Guardians)
CREATE TABLE IF NOT EXISTS public.leaders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT NOT NULL,
    photo_url TEXT,
    expertise TEXT DEFAULT 'Cultural Custodian',
    clan TEXT,
    contact_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- H. VOCABULARY TABLE (Lukenye Language Dictionary)
CREATE TABLE IF NOT EXISTS public.vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lukenye TEXT UNIQUE NOT NULL,
    english TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    usage TEXT,
    audio_url TEXT,
    example_sentence TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- I. STORY CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.story_categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 3. RECURSION-SAFE SECURITY FUNCTIONS
-- ==========================================
-- These SECURITY DEFINER functions bypass Row-Level Security checks temporarily
-- to fetch permissions, preventing infinite recursive query loops in RLS policies.
-- They include SET search_path to prevent hijacking and check active status.

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT role IN ('super_admin', 'admin') AND status = 'active' FROM public.profiles WHERE id = user_id),
        false
    );
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_elder(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT role = 'super_admin' AND status = 'active' FROM public.profiles WHERE id = user_id),
        false
    );
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_reporter(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT role IN ('super_admin', 'admin', 'reporter', 'staff') AND status = 'active' FROM public.profiles WHERE id = user_id),
        false
    );
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;


-- ==========================================
-- 4. AUTOMATIC SIGNUP TRIGGER (SECURE DEFENSE)
-- ==========================================
-- This trigger fires immediately upon auth.users signup.
-- Force-registers ALL new users with the 'customer' role.
-- Blocks malicious users from injecting high-privileged roles in metadata during signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, is_admin, status)
    VALUES (
        new.id,
        new.email,
        'customer', -- STRICT DEFAULT: No one can self-register as Admin or Elder
        false,
        'active'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- 4B. COLUMN-LEVEL PROFILE UPDATE PROTECTION TRIGGER
-- ==========================================
-- This trigger prevents users from self-promoting or bypassing account suspension.
-- Restricts role, is_admin, and status modifications strictly to Elders (super_admin).

CREATE OR REPLACE FUNCTION public.check_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only allow super_admin (Elders) to modify roles, admin status, or suspension status
    IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.is_admin IS DISTINCT FROM NEW.is_admin OR OLD.status IS DISTINCT FROM NEW.status) THEN
        IF auth.uid() IS NOT NULL AND NOT public.is_elder(auth.uid()) THEN
            RAISE EXCEPTION 'Unauthorized: Only Elders (super_admin) can change roles, admin flags, or account status.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_check_profile_changes
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.check_profile_changes();


-- ==========================================
-- 5. SECURE ROLE SYNC TRIGGER TO APP_METADATA
-- ==========================================
-- This trigger automatically synchronizes changes in public.profiles.role 
-- straight to Supabase's auth.users app_metadata.
-- This guarantees that the user's secure JWT token always contains their authentic
-- role (user.app_metadata.role), allowing immediate, lightweight client-side routing.

CREATE OR REPLACE FUNCTION public.sync_profile_role_to_app_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'role', new.role, 
            'is_admin', COALESCE(new.role IN ('super_admin', 'admin'), false)
        )
    WHERE id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_sync_profile_role_to_app_metadata
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_app_metadata();


-- ==========================================
-- 6. ENABLE ROW-LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW-LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW-LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW-LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW-LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW-LEVEL SECURITY;
ALTER TABLE public.clans ENABLE ROW-LEVEL SECURITY;
ALTER TABLE public.leaders ENABLE ROW-LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW-LEVEL SECURITY;
ALTER TABLE public.story_categories ENABLE ROW-LEVEL SECURITY;


-- ==========================================
-- 7. DEFINE SECURE RLS POLICIES
-- ==========================================

-- ------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------
-- Users can view all profiles (needed for author lookups/roles list)
CREATE POLICY "Allow public select on profiles" 
    ON public.profiles FOR SELECT 
    USING (true);

-- Users can update non-privileged fields of their own profile
CREATE POLICY "Allow users to update own profile metadata" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only Super Admins (Elders) can update roles or status
CREATE POLICY "Elders can manage profiles fully" 
    ON public.profiles FOR ALL 
    USING (public.is_elder(auth.uid()))
    WITH CHECK (public.is_elder(auth.uid()));


-- ------------------------------------------
-- ARTICLES POLICIES
-- ------------------------------------------
-- Anyone can view published articles
CREATE POLICY "Public can view published articles" 
    ON public.articles FOR SELECT 
    USING (status = 'published');

-- Editorial team can view all articles (including pending/rejected drafts)
CREATE POLICY "Editorial team can view all articles" 
    ON public.articles FOR SELECT 
    USING (public.is_reporter(auth.uid()));

-- Staff/Admins can write articles
CREATE POLICY "Editorial team can insert articles" 
    ON public.articles FOR INSERT 
    WITH CHECK (
        public.is_reporter(auth.uid())
        AND (reporter_id = auth.uid() OR public.is_admin(auth.uid()))
        AND (
            -- Non-Elders can only create 'pending' drafts
            (status = 'pending' AND NOT public.is_elder(auth.uid()))
            -- Elders can publish instantly
            OR public.is_elder(auth.uid())
        )
    );

-- Creators can update pending drafts, Admins can update pending/drafts, Elders can update/approve everything
CREATE POLICY "Allow authorized updates on articles" 
    ON public.articles FOR UPDATE 
    USING (
        public.is_admin(auth.uid()) 
        OR (reporter_id = auth.uid() AND status = 'pending')
    )
    WITH CHECK (
        -- Elders can update everything freely
        public.is_elder(auth.uid())
        -- Admins can update but cannot publish/approve content (status must not be 'published')
        OR (public.is_admin(auth.uid()) AND status != 'published')
        -- Creators can update pending drafts
        OR (reporter_id = auth.uid() AND status = 'pending')
    );

-- Only Admins/Elders can delete articles
CREATE POLICY "Admins and Elders can delete articles" 
    ON public.articles FOR DELETE 
    USING (public.is_admin(auth.uid()));


-- ------------------------------------------
-- CONTRIBUTIONS POLICIES
-- ------------------------------------------
-- Users can view their own contributions, Admins/Elders can view all
CREATE POLICY "View contributions policy" 
    ON public.contributions FOR SELECT 
    USING (
        reporter_id = auth.uid() 
        OR public.is_admin(auth.uid())
    );

-- Any authenticated user can submit a contribution
CREATE POLICY "Authenticated users can create contributions" 
    ON public.contributions FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated'
        AND reporter_id = auth.uid()
        AND status = 'pending' -- Always defaults to pending
    );

-- Only Admins/Elders can update or delete contributions, but only Elders can approve them
CREATE POLICY "Admins and Elders can manage contributions" 
    ON public.contributions FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (
        -- Elders can manage/approve fully
        public.is_elder(auth.uid())
        -- Admins can manage but cannot approve (status must not be 'approved')
        OR (public.is_admin(auth.uid()) AND status != 'approved')
    );


-- ------------------------------------------
-- GALLERY POLICIES
-- ------------------------------------------
-- Public can view approved media items
CREATE POLICY "Public can view approved gallery images" 
    ON public.gallery FOR SELECT 
    USING (status = 'approved');

-- Contributors can view their own pending items
CREATE POLICY "Authorized view of gallery items" 
    ON public.gallery FOR SELECT 
    USING (public.is_admin(auth.uid()));

-- Registered users can upload media to the gallery
CREATE POLICY "Registered users can upload gallery items" 
    ON public.gallery FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated'
        AND (
            -- Default users upload as 'pending'
            (status = 'pending' AND NOT public.is_elder(auth.uid()))
            -- Elders can publish instantly
            OR (status = 'approved' AND public.is_elder(auth.uid()))
        )
    );

-- Only Admins/Elders can manage gallery, but only Elders can approve
CREATE POLICY "Admins and Elders can manage gallery" 
    ON public.gallery FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (
        -- Elders can manage fully
        public.is_elder(auth.uid())
        -- Admins can manage but cannot approve (status must not be 'approved')
        OR (public.is_admin(auth.uid()) AND status != 'approved')
    );


-- ------------------------------------------
-- CLANS POLICIES
-- ------------------------------------------
-- Anyone can view approved clans
CREATE POLICY "Public can view approved clans" 
    ON public.clans FOR SELECT 
    USING (status = 'approved');

-- Editorial team can view all clans
CREATE POLICY "Editorial team can view all clans" 
    ON public.clans FOR SELECT 
    USING (public.is_reporter(auth.uid()));

-- Registered users can submit a clan
CREATE POLICY "Registered users can submit a clan" 
    ON public.clans FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated'
        AND (
            -- Default users upload as 'pending'
            (status = 'pending' AND NOT public.is_elder(auth.uid()))
            -- Elders can publish instantly
            OR (status = 'approved' AND public.is_elder(auth.uid()))
        )
    );

-- Only Elders (super_admin) can approve/reject, update or delete clans
CREATE POLICY "Elders can manage clans fully" 
    ON public.clans FOR ALL 
    USING (public.is_elder(auth.uid()))
    WITH CHECK (public.is_elder(auth.uid()));


-- ------------------------------------------
-- LEADERS POLICIES
-- ------------------------------------------
-- Public can view approved leaders/elders
CREATE POLICY "Public can view approved leaders" 
    ON public.leaders FOR SELECT 
    USING (status = 'approved');

-- Editorial team can view all leaders/elders
CREATE POLICY "Editorial team can view all leaders" 
    ON public.leaders FOR SELECT 
    USING (public.is_reporter(auth.uid()));

-- Registered users can submit an elder nominee
CREATE POLICY "Registered users can submit a leader" 
    ON public.leaders FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated'
        AND (
            -- Default users upload as 'pending'
            (status = 'pending' AND NOT public.is_elder(auth.uid()))
            -- Elders can publish instantly
            OR (status = 'approved' AND public.is_elder(auth.uid()))
        )
    );

-- Only Admins/Elders can manage leaders, but only Elders can approve
CREATE POLICY "Admins and Elders can manage leaders" 
    ON public.leaders FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (
        -- Elders can manage/approve fully
        public.is_elder(auth.uid())
        -- Admins can manage but cannot approve (status must not be 'approved')
        OR (public.is_admin(auth.uid()) AND status != 'approved')
    );


-- ------------------------------------------
-- VOCABULARY POLICIES
-- ------------------------------------------
-- Anyone can view approved vocabulary/dictionary terms
CREATE POLICY "Public can view approved vocabulary" 
    ON public.vocabulary FOR SELECT 
    USING (status = 'approved');

-- Editorial team can view pending terms
CREATE POLICY "Editorial team can view pending vocabulary" 
    ON public.vocabulary FOR SELECT 
    USING (public.is_reporter(auth.uid()));

-- Registered users can suggest vocabulary/dictionary terms
CREATE POLICY "Registered users can suggest vocabulary" 
    ON public.vocabulary FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated'
        AND (
            -- Default users upload as 'pending'
            (status = 'pending' AND NOT public.is_elder(auth.uid()))
            -- Elders can publish instantly
            OR (status = 'approved' AND public.is_elder(auth.uid()))
        )
    );

-- Only Admins/Elders can manage vocabulary, but only Elders can approve
CREATE POLICY "Admins and Elders can manage vocabulary" 
    ON public.vocabulary FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (
        -- Elders can manage/approve fully
        public.is_elder(auth.uid())
        -- Admins can manage but cannot approve (status must not be 'approved')
        OR (public.is_admin(auth.uid()) AND status != 'approved')
    );


-- ------------------------------------------
-- CONTACT MESSAGES POLICIES
-- ------------------------------------------
-- Anyone can send a support/contact message
CREATE POLICY "Anyone can send contact messages" 
    ON public.contact_messages FOR INSERT 
    WITH CHECK (true);

-- Only Admins/Elders can read, reply, or delete contact messages
CREATE POLICY "Admins and Elders can manage contact messages" 
    ON public.contact_messages FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));


-- ------------------------------------------
-- STORY CATEGORIES POLICIES
-- ------------------------------------------
-- Anyone can read story categories
CREATE POLICY "Public can view story categories" 
    ON public.story_categories FOR SELECT 
    USING (true);

-- Only Admins/Elders can create/update/delete categories
CREATE POLICY "Admins and Elders can manage story categories" 
    ON public.story_categories FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));


-- ==========================================
-- 8. STORAGE BUCKET SECURITY & POLICIES
-- ==========================================
-- Enables Secure RLS on Supabase Storage buckets if they exist.
-- Create a public bucket called 'media' and allow secure uploads.

-- Note: In Supabase, bucket creation is handled through the storage schema.
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'media' bucket
CREATE POLICY "Public can read media bucket" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload to media bucket" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'media' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Admins and Elders can delete media objects" 
    ON storage.objects FOR DELETE 
    USING (
        bucket_id = 'media' 
        AND public.is_admin(auth.uid())
    );


-- ==========================================
-- 9. DATABASE PERFORMANCE OPTIMIZATIONS (INDEXES)
-- ==========================================
-- Create crucial non-clustered indexes on foreign keys and RLS status/role filter columns
-- to prevent full-table scans during policy checks and common front-end queries.

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

CREATE INDEX IF NOT EXISTS idx_articles_reporter_id ON public.articles(reporter_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);

CREATE INDEX IF NOT EXISTS idx_contributions_reporter_id ON public.contributions(reporter_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);

CREATE INDEX IF NOT EXISTS idx_gallery_status ON public.gallery(status);
CREATE INDEX IF NOT EXISTS idx_clans_status ON public.clans(status);
CREATE INDEX IF NOT EXISTS idx_leaders_status ON public.leaders(status);
CREATE INDEX IF NOT EXISTS idx_vocabulary_status ON public.vocabulary(status);


-- =========================================================================
-- 10. NEW MODULES: STATUSES, NEWS, ANNOUNCEMENTS, AND EVENTS
-- =========================================================================

-- A. STATUSES TABLE
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT,
    media_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of objects: {url: string, type: 'image' | 'video' | 'audio'}
    link TEXT,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    view_count INTEGER NOT NULL DEFAULT 0,
    visibility TEXT NOT NULL DEFAULT 'public', -- 'public', 'private'
    status TEXT NOT NULL DEFAULT 'pending', -- 'draft', 'pending', 'approved', 'archived', 'expired'
    reactions JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g., {"like": 0, "love": 0}
    comments JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g., [{"user_id": "...", "text": "...", "created_at": "..."}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '24 hours'),
    is_archived BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ
);

-- B. NEWS TABLE
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'General',
    tags TEXT[] DEFAULT '{}',
    featured BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending', -- 'draft', 'pending', 'approved', 'published', 'rejected', 'archived'
    published_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- C. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'community', -- 'meetings', 'emergencies', 'community notices', 'scholarships', 'ceremonies', 'website notices'
    priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'emergency'
    start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMPTZ,
    pinned BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'draft', 'pending', 'approved', 'archived', 'rejected'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- D. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    cover_image TEXT,
    organizer TEXT NOT NULL,
    contact TEXT,
    rsvp_settings JSONB NOT NULL DEFAULT '{"enabled": false, "limit": null}'::jsonb,
    map_location JSONB NOT NULL DEFAULT '{"latitude": null, "longitude": null}'::jsonb,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'draft', 'pending', 'approved', 'rejected', 'archived'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- =========================================================================
-- 11. APPROVAL TRIGGERS FOR THE NEW MODULES (SECURITY ENFORCED)
-- =========================================================================

-- Statuses approval trigger
CREATE OR REPLACE FUNCTION public.handle_statuses_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.status IS NULL) THEN
        NEW.approved_by := auth.uid();
        NEW.approved_at := timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_statuses_approval
    BEFORE INSERT OR UPDATE ON public.statuses
    FOR EACH ROW EXECUTE FUNCTION public.handle_statuses_approval();

-- News approval trigger
CREATE OR REPLACE FUNCTION public.handle_news_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('approved', 'published') AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.status IS NULL) THEN
        NEW.approved_by := auth.uid();
        NEW.approved_at := timezone('utc'::text, now());
        IF NEW.published_at IS NULL THEN
            NEW.published_at := timezone('utc'::text, now());
        END IF;
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_news_approval
    BEFORE INSERT OR UPDATE ON public.news
    FOR EACH ROW EXECUTE FUNCTION public.handle_news_approval();

-- Announcements approval trigger
CREATE OR REPLACE FUNCTION public.handle_announcements_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.status IS NULL) THEN
        NEW.approved_by := auth.uid();
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_announcements_approval
    BEFORE INSERT OR UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.handle_announcements_approval();

-- Events approval trigger
CREATE OR REPLACE FUNCTION public.handle_events_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.status IS NULL) THEN
        NEW.approved_by := auth.uid();
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_events_approval
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_events_approval();


-- =========================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES FOR THE NEW MODULES
-- =========================================================================

ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 12A. STATUSES POLICIES
CREATE POLICY "Public can view active approved statuses"
    ON public.statuses FOR SELECT
    USING (
        status = 'approved'
        AND NOT is_archived
        AND expires_at > timezone('utc'::text, now())
    );

CREATE POLICY "Authors can view own statuses"
    ON public.statuses FOR SELECT
    USING (auth.uid() = author_id);

CREATE POLICY "Editorial team can view all statuses"
    ON public.statuses FOR SELECT
    USING (public.is_reporter(auth.uid()));

CREATE POLICY "Authenticated users can create statuses"
    ON public.statuses FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND author_id = auth.uid()
        AND (
            -- Non-Elders must submit as 'draft' or 'pending'
            (status IN ('draft', 'pending') AND NOT public.is_elder(auth.uid()))
            -- Only Elders can insert as approved/visible instantly
            OR (status = 'approved' AND public.is_elder(auth.uid()))
        )
    );

CREATE POLICY "Elders can manage statuses fully"
    ON public.statuses FOR UPDATE
    USING (public.is_elder(auth.uid()))
    WITH CHECK (public.is_elder(auth.uid()));

CREATE POLICY "Admins can manage but not approve statuses"
    ON public.statuses FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (
        public.is_admin(auth.uid())
        AND status != 'approved'
    );

CREATE POLICY "Authors can update own pending statuses"
    ON public.statuses FOR UPDATE
    USING (auth.uid() = author_id AND status IN ('draft', 'pending'))
    WITH CHECK (
        auth.uid() = author_id
        AND status IN ('draft', 'pending')
    );

CREATE POLICY "Admins and Elders can delete statuses"
    ON public.statuses FOR DELETE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Authors can delete own drafts"
    ON public.statuses FOR DELETE
    USING (auth.uid() = author_id AND status = 'draft');


-- 12B. NEWS POLICIES
CREATE POLICY "Public can view published news"
    ON public.news FOR SELECT
    USING (status = 'published');

CREATE POLICY "Authors can view own news"
    ON public.news FOR SELECT
    USING (auth.uid() = author_id);

CREATE POLICY "Editorial team can view all news"
    ON public.news FOR SELECT
    USING (public.is_reporter(auth.uid()));

CREATE POLICY "Reporters can insert news"
    ON public.news FOR INSERT
    WITH CHECK (
        public.is_reporter(auth.uid())
        AND author_id = auth.uid()
        AND (
            -- Non-Elders must submit as 'draft' or 'pending'
            (status IN ('draft', 'pending') AND NOT public.is_elder(auth.uid()))
            -- Only Elders can insert as approved/published instantly
            OR (status IN ('approved', 'published') AND public.is_elder(auth.uid()))
        )
    );

CREATE POLICY "Elders can manage news fully"
    ON public.news FOR UPDATE
    USING (public.is_elder(auth.uid()))
    WITH CHECK (public.is_elder(auth.uid()));

CREATE POLICY "Admins can manage but not approve news"
    ON public.news FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (
        public.is_admin(auth.uid())
        AND status NOT IN ('approved', 'published')
    );

CREATE POLICY "Authors can update own news drafts"
    ON public.news FOR UPDATE
    USING (auth.uid() = author_id AND status IN ('draft', 'pending'))
    WITH CHECK (
        auth.uid() = author_id
        AND status IN ('draft', 'pending')
    );

CREATE POLICY "Admins and Elders can delete news"
    ON public.news FOR DELETE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Authors can delete own news drafts"
    ON public.news FOR DELETE
    USING (auth.uid() = author_id AND status = 'draft');


-- 12C. ANNOUNCEMENTS POLICIES
CREATE POLICY "Public can view active approved announcements"
    ON public.announcements FOR SELECT
    USING (
        status = 'approved'
        AND start_date <= timezone('utc'::text, now())
        AND (end_date IS NULL OR end_date >= timezone('utc'::text, now()))
    );

CREATE POLICY "Authors can view own announcements"
    ON public.announcements FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Editorial team can view all announcements"
    ON public.announcements FOR SELECT
    USING (public.is_reporter(auth.uid()));

CREATE POLICY "Reporters can insert announcements"
    ON public.announcements FOR INSERT
    WITH CHECK (
        public.is_reporter(auth.uid())
        AND created_by = auth.uid()
        AND (
            -- Non-Elders must submit as 'draft' or 'pending'
            (status IN ('draft', 'pending') AND NOT public.is_elder(auth.uid()))
            -- Only Elders can insert as approved instantly
            OR (status = 'approved' AND public.is_elder(auth.uid()))
        )
    );

CREATE POLICY "Elders can manage announcements fully"
    ON public.announcements FOR UPDATE
    USING (public.is_elder(auth.uid()))
    WITH CHECK (public.is_elder(auth.uid()));

CREATE POLICY "Admins can manage but not approve announcements"
    ON public.announcements FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (
        public.is_admin(auth.uid())
        AND status != 'approved'
    );

CREATE POLICY "Authors can update own announcements drafts"
    ON public.announcements FOR UPDATE
    USING (auth.uid() = created_by AND status IN ('draft', 'pending'))
    WITH CHECK (
        auth.uid() = created_by
        AND status IN ('draft', 'pending')
    );

CREATE POLICY "Admins and Elders can delete announcements"
    ON public.announcements FOR DELETE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Authors can delete own announcements drafts"
    ON public.announcements FOR DELETE
    USING (auth.uid() = created_by AND status = 'draft');


-- 12D. EVENTS POLICIES
CREATE POLICY "Public can view approved events"
    ON public.events FOR SELECT
    USING (status = 'approved');

CREATE POLICY "Authors can view own events"
    ON public.events FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Editorial team can view all events"
    ON public.events FOR SELECT
    USING (public.is_reporter(auth.uid()));

CREATE POLICY "Reporters can insert events"
    ON public.events FOR INSERT
    WITH CHECK (
        public.is_reporter(auth.uid())
        AND created_by = auth.uid()
        AND (
            -- Non-Elders must submit as 'draft' or 'pending'
            (status IN ('draft', 'pending') AND NOT public.is_elder(auth.uid()))
            -- Only Elders can insert as approved instantly
            OR (status = 'approved' AND public.is_elder(auth.uid()))
        )
    );

CREATE POLICY "Elders can manage events fully"
    ON public.events FOR UPDATE
    USING (public.is_elder(auth.uid()))
    WITH CHECK (public.is_elder(auth.uid()));

CREATE POLICY "Admins can manage but not approve events"
    ON public.events FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (
        public.is_admin(auth.uid())
        AND status != 'approved'
    );

CREATE POLICY "Authors can update own events drafts"
    ON public.events FOR UPDATE
    USING (auth.uid() = created_by AND status IN ('draft', 'pending'))
    WITH CHECK (
        auth.uid() = created_by
        AND status IN ('draft', 'pending')
    );

CREATE POLICY "Admins and Elders can delete events"
    ON public.events FOR DELETE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Authors can delete own events drafts"
    ON public.events FOR DELETE
    USING (auth.uid() = created_by AND status = 'draft');


-- =========================================================================
-- 13. DATABASE PERFORMANCE OPTIMIZATIONS (NEW MODULE INDEXES)
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_statuses_author_id ON public.statuses(author_id);
CREATE INDEX IF NOT EXISTS idx_statuses_status ON public.statuses(status);
CREATE INDEX IF NOT EXISTS idx_statuses_expires_at ON public.statuses(expires_at);

CREATE INDEX IF NOT EXISTS idx_news_author_id ON public.news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON public.news(status);
CREATE INDEX IF NOT EXISTS idx_news_featured ON public.news(featured);

CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);

CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_datetime ON public.events(start_datetime);
