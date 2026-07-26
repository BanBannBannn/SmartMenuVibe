-- Migration: Create feedback table for customer inquiries and feedback
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'support', 'other')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to insert feedback
CREATE POLICY "Allow public insert to feedback"
    ON public.feedback
    FOR INSERT
    TO public, authenticated, anon
    WITH CHECK (true);

-- Allow admins to read feedback
CREATE POLICY "Allow authenticated staff to read feedback"
    ON public.feedback
    FOR SELECT
    TO authenticated
    USING (true);
