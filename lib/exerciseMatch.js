// Utilitário compartilhado para encontrar o exercício mais correspondente dentro do banco
// exercises-ptbr.json. Substitui comparações ingênuas por `includes()` (que pegam o primeiro
// resultado parcial e frequentemente mapeiam pro exercício errado/imagem errada) por uma busca
// que prioriza: 1) igualdade exata, 2) uma string contendo totalmente a outra (a mais próxima em
// tamanho), 3) maior sobreposição de palavras. Isso reduz bastante os casos de nome/imagem
// incompatíveis quando o usuário digita um nome livre ou um exercício customizado.

export function normalizeExerciseName(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordOverlapScore(a, b) {
  const wa = new Set(a.split(" ").filter(Boolean));
  const wb = new Set(b.split(" ").filter(Boolean));
  if (!wa.size || !wb.size) return 0;
  let common = 0;
  wa.forEach((w) => { if (wb.has(w)) common += 1; });
  return common / Math.max(wa.size, wb.size);
}

/**
 * Encontra o melhor exercício correspondente em `db` (array com campo `name`) para `query`.
 * Retorna o item do db ou null.
 */
export function findBestExerciseMatch(query, db) {
  if (!query || !Array.isArray(db) || !db.length) return null;
  const nq = normalizeExerciseName(query);
  if (!nq) return null;

  // 1) Igualdade exata (ignorando acentos/caixa)
  const exact = db.find((ex) => normalizeExerciseName(ex.name) === nq);
  if (exact) return exact;

  // 2) Um contém o outro por completo — escolhe o candidato com o tamanho mais próximo do query
  //    (evita pegar "Rosca" e cair no primeiro item genérico da lista)
  let bestContains = null;
  let bestContainsDiff = Infinity;
  for (const ex of db) {
    const nn = normalizeExerciseName(ex.name);
    if (!nn) continue;
    if (nn.includes(nq) || nq.includes(nn)) {
      const diff = Math.abs(nn.length - nq.length);
      if (diff < bestContainsDiff) {
        bestContainsDiff = diff;
        bestContains = ex;
      }
    }
  }
  if (bestContains && bestContainsDiff <= 6) return bestContains;

  // 3) Maior sobreposição de palavras (score >= 0.5 pra evitar falsos positivos)
  let bestScore = 0;
  let bestMatch = bestContains; // fallback pro contains mesmo que a diferença de tamanho seja grande
  for (const ex of db) {
    const nn = normalizeExerciseName(ex.name);
    if (!nn) continue;
    const score = wordOverlapScore(nq, nn);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = ex;
    }
  }
  if (bestScore >= 0.5) return bestMatch;

  return bestContains || null;
}
