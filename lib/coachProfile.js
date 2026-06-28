/**
 * Gerenciamento do perfil do Coach — persiste no localStorage E no Supabase.
 *
 * O perfil contém:
 *  - objetivo, nivel, dieta, interesses (detectados automaticamente nas conversas)
 *  - resumo: texto gerado pelo Groq sumarizando o que o Coach aprendeu sobre o usuário
 *  - updatedAt: timestamp da última atualização
 */

import { supabase } from "./supabase";

const LS_KEY = "hdos_coach_profile";

export function loadProfile() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}

export function saveProfileLocal(profile) {
  const updated = { ...profile, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch {}
  return updated;
}

/** Salva no localStorage + Supabase (se configurado e usuário logado) */
export async function saveProfile(profile) {
  const updated = saveProfileLocal(profile);

  if (!supabase) return updated;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return updated;

    await supabase
      .from("user_data")
      .upsert({
        user_id: user.id,
        coach_profile: updated,
        updated_at: updated.updatedAt,
      }, { onConflict: "user_id", ignoreDuplicates: false });
  } catch (e) {
    console.warn("[coachProfile] Supabase sync falhou:", e.message);
  }

  return updated;
}

/** Carrega do Supabase e mescla com o localStorage (Supabase ganha em conflito de data) */
export async function loadProfileFromCloud() {
  if (!supabase) return loadProfile();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return loadProfile();

    const { data, error } = await supabase
      .from("user_data")
      .select("coach_profile")
      .eq("user_id", user.id)
      .single();

    if (error || !data?.coach_profile) return loadProfile();

    const cloud   = data.coach_profile;
    const local   = loadProfile();
    const cloudTs = new Date(cloud.updatedAt || 0).getTime();
    const localTs = new Date(local.updatedAt  || 0).getTime();

    const merged = cloudTs >= localTs ? { ...local, ...cloud } : { ...cloud, ...local };
    saveProfileLocal(merged);
    return merged;
  } catch {
    return loadProfile();
  }
}

/** Mescla hints novos no perfil e persiste */
export async function mergeProfileHints(hints) {
  if (!hints || !Object.keys(hints).length) return;
  const current = loadProfile();
  const updated = { ...current, ...hints };
  await saveProfile(updated);
  return updated;
}
