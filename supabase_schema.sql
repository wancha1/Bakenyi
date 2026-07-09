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

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT role IN ('super_admin', 'admin') FROM public.profiles WHERE id = user_id),
        false
    );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_elder(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT role = 'super_admin' FROM public.profiles WHERE id = user_id),
        false
    );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_reporter(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT role IN ('super_admin', 'admin', 'reporter', 'staff') FROM public.profiles WHERE id = user_id),
        false
    );
$$ LANGUAGE SQL SECURITY DEFINER;


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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    WITH CHECK (
        auth.uid() = id 
        AND role = public.get_user_role(auth.uid()) -- Enforces role cannot be changed by owner
        AND is_admin = (public.get_user_role(auth.uid()) IN ('super_admin', 'admin')) -- Enforces is_admin cannot be changed
    );

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
        AND (
            -- Reporters can only create 'pending' drafts
            (status = 'pending' AND NOT public.is_admin(auth.uid()))
            -- Admins/Elders can publish instantly
            OR public.is_admin(auth.uid())
        )
    );

-- Creators can update pending drafts, Admins/Elders can update everything
CREATE POLICY "Allow authorized updates on articles" 
    ON public.articles FOR UPDATE 
    USING (
        public.is_admin(auth.uid()) 
        OR (reporter_id = auth.uid() AND status = 'pending')
    )
    WITH CHECK (
        public.is_admin(auth.uid()) 
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

-- Only Admins/Elders can update or delete contributions
CREATE POLICY "Admins and Elders can manage contributions" 
    ON public.contributions FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));


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
            (status = 'pending' AND NOT public.is_admin(auth.uid()))
            -- Admins/Elders can publish instantly
            OR (status = 'approved' AND public.is_admin(auth.uid()))
        )
    );

-- Only Admins/Elders can approve/update or delete gallery items
CREATE POLICY "Admins and Elders can manage gallery" 
    ON public.gallery FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));


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
            (status = 'pending' AND NOT public.is_admin(auth.uid()))
            -- Admins/Elders can publish instantly
            OR (status = 'approved' AND public.is_admin(auth.uid()))
        )
    );

-- Only Admins/Elders can approve/manage leaders
CREATE POLICY "Admins and Elders can manage leaders" 
    ON public.leaders FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));


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
            (status = 'pending' AND NOT public.is_admin(auth.uid()))
            -- Admins/Elders can publish instantly
            OR (status = 'approved' AND public.is_admin(auth.uid()))
        )
    );

-- Only Admins/Elders can approve/manage vocabulary terms
CREATE POLICY "Admins and Elders can manage vocabulary" 
    ON public.vocabulary FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));


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
    );

CREATE POLICY "Admins and Elders can delete media objects" 
    ON storage.objects FOR DELETE 
    USING (
        bucket_id = 'media' 
        AND public.is_admin(auth.uid())
    );
