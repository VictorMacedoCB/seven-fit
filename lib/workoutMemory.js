/**
 * Formata os treinos recentes do usuário em texto para injetar
 * no contexto do Coach de IA.
 *
 * Usado em: app/api/coach-chat/route.js
 */

/**
 * Recebe o array workoutLogs do state do app e retorna um resumo
 * dos últimos N dias de treino em texto compacto.
 *
 * @param {Array}  workoutLogs  - state.workoutLogs do app
 * @param {number} days         - quantos dias de histórico incluir (padrão: 14)
 */
export function formatRecentWorkouts(workoutLogs = [], days = 14) {
  if (!workoutLogs?.length) return null;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recent = workoutLogs
    .filter(w => w.date && new Date(w.date) >= cutoff)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10); // máximo 10 sessões pra não estourar o contexto

  if (!recent.length) return null;

  const lines = recent.map(w => {
    const dateStr = new Date(w.date).toLocaleDateString("pt-BR", { weekday:"short", day:"numeric", month:"short" });
    const exLines = (w.exercises || []).map(ex => {
      const sets    = (ex.sets || []).filter(s => s.type !== "aquecimento");
      if (!sets.length) return null;
      const vol     = sets.reduce((a, s) => a + (s.weight || 0) * (s.reps || 0), 0);
      const topSet  = sets.reduce((best, s) =>
        ((s.weight || 0) * (s.reps || 0)) > ((best.weight || 0) * (best.reps || 0)) ? s : best, sets[0]);
      return `    ${ex.name}: ${sets.length} séries · melhor ${topSet.weight}kg×${topSet.reps} · vol ${vol.toFixed(0)}kg`;
    }).filter(Boolean);

    if (!exLines.length) return null;
    return `• ${dateStr} — ${w.type || "Treino"}\n${exLines.join("\n")}`;
  }).filter(Boolean);

  if (!lines.length) return null;

  return `\n\n--- HISTÓRICO RECENTE DE TREINOS DO USUÁRIO (últimos ${days} dias) ---\n${lines.join("\n")}\n--- FIM DO HISTÓRICO ---`;
}

/**
 * Calcula stats simples dos treinos recentes para o resumo do Coach.
 */
export function calcWorkoutStats(workoutLogs = [], days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recent = workoutLogs.filter(w => w.date && new Date(w.date) >= cutoff);
  if (!recent.length) return null;

  const totalVol = recent.reduce((total, w) =>
    total + (w.exercises || []).reduce((a, ex) =>
      a + (ex.sets || []).reduce((b, s) => b + (s.weight||0)*(s.reps||0), 0), 0), 0);

  const muscleCounts = {};
  recent.forEach(w => {
    (w.exercises || []).forEach(ex => {
      muscleCounts[ex.name] = (muscleCounts[ex.name] || 0) + 1;
    });
  });

  const topExercises = Object.entries(muscleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `${name} (${count}x)`);

  return {
    sessions:      recent.length,
    totalVolume:   Math.round(totalVol),
    topExercises,
    avgPerWeek:    (recent.length / (days / 7)).toFixed(1),
  };
}
