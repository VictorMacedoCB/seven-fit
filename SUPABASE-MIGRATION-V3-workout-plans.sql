-- ============================================================================
-- HeavyDutyOS — Migration V3
-- Adiciona a tabela "workout_plans", que faltava no schema.
--
-- Por que isso é necessário:
-- Os planos de exercícios por divisão (Upper, Lower, Push, Pull, Legs, etc.)
-- só estavam sendo salvos no localStorage do navegador. Nunca existia uma
-- tabela no Supabase para eles, então o app "parecia" sincronizar (o ícone
-- girava) mas essa informação especificamente nunca ia pra nuvem — e por
-- isso sumia ao trocar de dispositivo, limpar o navegador, ou reinstalar o
-- app. Esta migration cria a tabela que faltava e o código do app (lib/db.js)
-- já foi atualizado para gravar/ler dela.
--
-- Como rodar: Supabase Dashboard → SQL Editor → cole este arquivo → Run.
-- ============================================================================

create table if not exists public.workout_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plans jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workout_plans enable row level security;

drop policy if exists "Users can view their own workout plans" on public.workout_plans;
create policy "Users can view their own workout plans"
  on public.workout_plans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own workout plans" on public.workout_plans;
create policy "Users can insert their own workout plans"
  on public.workout_plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own workout plans" on public.workout_plans;
create policy "Users can update their own workout plans"
  on public.workout_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own workout plans" on public.workout_plans;
create policy "Users can delete their own workout plans"
  on public.workout_plans for delete
  using (auth.uid() = user_id);
