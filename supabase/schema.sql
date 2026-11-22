-- ==============================================================================
-- Zenith AI Chatbot - Supabase Storage & Database Schema
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Create Storage Bucket for chat uploads
insert into storage.buckets (id, name, public)
values ('chat-uploads', 'chat-uploads', true)
on conflict (id) do nothing;

-- 2. Storage Policies (Allow public read and uploads)
create policy "Public Access to chat-uploads"
on storage.objects for select
using (bucket_id = 'chat-uploads');

create policy "Allow Uploads to chat-uploads"
on storage.objects for insert
with check (bucket_id = 'chat-uploads');

create policy "Allow Updates to chat-uploads"
on storage.objects for update
using (bucket_id = 'chat-uploads');

create policy "Allow Deletes from chat-uploads"
on storage.objects for delete
using (bucket_id = 'chat-uploads');

-- 3. Chat Sessions Table
create table if not exists public.chat_sessions (
  id text primary key,
  title text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Chat Messages Table
create table if not exists public.chat_messages (
  id text primary key,
  session_id text references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text default '',
  attachments jsonb default '[]'::jsonb,
  image_url text,
  is_image boolean default false,
  created_at timestamptz default now()
);

-- Index on session_id for fast retrieval
create index if not exists idx_chat_messages_session_id
on public.chat_messages (session_id);

-- 5. Enable Row Level Security (RLS)
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- 6. Open RLS Policies for Anonymous Client Access
create policy "Allow all on chat_sessions"
on public.chat_sessions for all
using (true)
with check (true);

create policy "Allow all on chat_messages"
on public.chat_messages for all
using (true)
with check (true);
