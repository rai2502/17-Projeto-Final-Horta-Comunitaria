-- Horta Comunitária | Estrutura inicial do Supabase
-- Execute este script no SQL Editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

create table if not exists public.diario_canteiros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  canteiro text not null,
  atividade text not null,
  foto_base64 text,
  criado_em timestamptz default now()
);

alter table public.diario_canteiros enable row level security;

-- Cada voluntário pode consultar os próprios registros.
create policy "Usuário consulta seus registros"
on public.diario_canteiros for select
to authenticated
using (auth.uid() = user_id);

-- Cada voluntário pode criar registros vinculados à própria conta.
create policy "Usuário cria seus registros"
on public.diario_canteiros for insert
to authenticated
with check (auth.uid() = user_id);

-- Cada voluntário pode excluir somente os próprios registros.
create policy "Usuário exclui seus registros"
on public.diario_canteiros for delete
to authenticated
using (auth.uid() = user_id);

-- Índice para carregar o diário em ordem cronológica.
create index if not exists diario_canteiros_criado_em_idx
on public.diario_canteiros (criado_em desc);

-- Observação: foto_base64 é TEXT para manter a modelagem simples do MVP.
-- Em uma versão de produção, prefira Supabase Storage e salve aqui apenas a URL.
