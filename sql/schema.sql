-- Supabase SQL schema for Batik Sumatera Selatan classification app

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  role text not null default 'admin'
);

create table if not exists batik_predictions (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  prediction_label text not null,
  confidence_score double precision not null,
  model_version text,
  created_at timestamp with time zone default now()
);

create table if not exists datasets (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  label text not null,
  name text not null,
  category text,
  origin text,
  usage text,
  history text,
  philosophy text,
  characteristic text,
  gallery_description text,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create table if not exists explorer_songkets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  category text,
  origin text,
  usage text,
  history text,
  philosophy text,
  characteristic text,
  gallery_description text,
  thumbnail text,
  published boolean default false,
  is_builtin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists explorer_songket_images (
  id uuid primary key default gen_random_uuid(),
  explorer_songket_id uuid references explorer_songkets(id) on delete cascade,
  image_url text not null,
  image_order integer default 0,
  is_cover boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists model_metrics (
  id uuid primary key default gen_random_uuid(),
  accuracy double precision,
  loss double precision,
  created_at timestamp with time zone default now()
);


-- New: comprehensive model statistics for analytics dashboard
create table if not exists model_statistics (
  id uuid primary key default gen_random_uuid(),
  accuracy double precision,
  precision double precision,
  recall double precision,
  f1_score double precision,
  confusion_matrix jsonb,
  dataset_count integer,
  training_date timestamp with time zone,
  training_duration_seconds integer,
  average_confidence double precision,
  model_version text,
  last_training timestamp with time zone default now(),
  status text,
  created_at timestamp with time zone default now()
);
