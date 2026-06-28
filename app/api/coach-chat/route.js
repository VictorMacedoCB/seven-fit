import { NextResponse } from "next/server";
import exercisesDb from "@/lib/exercises-ptbr.json";
import { formatRecentWorkouts } from "@/lib/workoutMemory";

// knowledge-base.json é gerado offline e commitado no repo.
// Se ainda não existir (base vazia), o coach funciona só com os exercícios.
let knowledgeBase = [];
try {
  knowledgeBase = (await import("@/data/knowledge-base.json", { assert: { type: "json" } })).default;
} catch { /* arquivo ainda vazio ou inexistente — ok */ }

/**
 * POST /api/coach-chat
 *
 * Contexto duplo:
 *   1. exercises-ptbr.json  → 873 exercícios traduzidos (treino, técnica, músculos)
 *   2. data/knowledge-base.json → chunks das transcrições dos vídeos dos influenciadores
 *      (treino, dieta, cardio, suplementação, mentalidade — tudo que estiver nos vídeos)
 *
 * Busca: TF-IDF simplificado por similaridade de cosseno (sem modelo externo, roda serverless).
 * LLM: Groq Llama 3.3 70B — gratuito.
 */

const GROQ_URL  = "https://api.groq.com/openai/v1/chat/completions";
const MODEL     = "llama-3.3-70b-versatile";

// ── Stopwords PT ─────────────────────────────────────────────────────────────
const STOP = new Set(["a","o","as","os","de","da","do","das","dos","e","é","em","um","uma",
  "que","para","por","com","no","na","nos","nas","ao","se","seu","sua","como","mais",
  "não","sim","eu","ele","ela","você","voce","isso","esse","esta","este","tem","ter",
  "foi","ser","já","mas","muito","também","tambem","sobre","pra","pro"]);

function tokenize(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9\s]/g," ").split(/\s+/)
    .filter(t => t.length > 2 && !STOP.has(t));
}

// ── Índice TF-IDF (construído uma vez por cold-start) ────────────────────────
let _kbIndex = null;

function buildKbIndex() {
  if (!knowledgeBase.length) return null;
  const docs = knowledgeBase.map(c => tokenize(c.text));
  const df   = new Map();
  docs.forEach(tokens => new Set(tokens).forEach(t => df.set(t,(df.get(t)||0)+1)));
  const N   = docs.length;
  const idf = new Map([...df].map(([t,n]) => [t, Math.log((N+1)/(n+1))+1]));
  const vecs = docs.map(tokens => {
    const tf  = new Map();
    tokens.forEach(t => tf.set(t,(tf.get(t)||0)+1));
    const vec = new Map();
    tf.forEach((n,t) => vec.set(t,(n/tokens.length)*(idf.get(t)||0)));
    return vec;
  });
  return { vecs, idf };
}

function cosineSim(a, b) {
  let dot=0, na=0, nb=0;
  a.forEach((v,k) => { na+=v*v; if(b.has(k)) dot+=v*b.get(k); });
  b.forEach(v => nb+=v*v);
  return (na&&nb) ? dot/Math.sqrt(na*nb) : 0;
}

function queryVec(tokens, idf) {
  const tf = new Map();
  tokens.forEach(t => tf.set(t,(tf.get(t)||0)+1));
  const vec = new Map();
  tf.forEach((n,t) => { if(idf.has(t)) vec.set(t,(n/tokens.length)*idf.get(t)); });
  return vec;
}

// ── Busca na knowledge-base dos vídeos ───────────────────────────────────────
function searchVideos(query, topK = 4) {
  if (!knowledgeBase.length) return [];
  if (!_kbIndex) _kbIndex = buildKbIndex();
  if (!_kbIndex) return [];

  const qTokens = tokenize(query);
  const qVec    = queryVec(qTokens, _kbIndex.idf);

  return _kbIndex.vecs
    .map((vec, i) => ({ chunk: knowledgeBase[i], score: cosineSim(qVec, vec) }))
    .filter(r => r.score > 0.04)
    .sort((a,b) => b.score - a.score)
    .slice(0, topK)
    .map(r => r.chunk);
}

// ── Busca nos exercícios (já em PT-BR) ───────────────────────────────────────
function searchExercises(query, topK = 3) {
  const q     = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const words = q.split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  if (!words.length) return [];

  return exercisesDb
    .map(ex => {
      const hay = (ex.name+" "+(ex.primaryMuscles??[]).join(" ")+" "+(ex.instructions??[]).join(" "))
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      const score = words.reduce((a,w) => a+(hay.includes(w)?1:0),0);
      return { ex, score };
    })
    .filter(r => r.score > 0)
    .sort((a,b) => b.score-a.score)
    .slice(0, topK)
    .map(({ex}) => ({
      name: ex.name,
      muscles: (ex.primaryMuscles??[]).join(", "),
      equipment: ex.equipment ?? "",
      instructions: (ex.instructions??[]).slice(0,3).join(" "),
    }));
}

// ── Hints de perfil ───────────────────────────────────────────────────────────
function extractProfileHints(msg) {
  const l = msg.toLowerCase();
  const hints = {};
  if (/(cutting|emagrecer|perder gordura|déficit|deficit)/.test(l))    hints.objetivo   = "cutting";
  if (/(bulking|ganhar massa|hipertrofia|superávit|superavit)/.test(l)) hints.objetivo   = "bulking";
  if (/(recomp|recomposição|recomposicao)/.test(l))                     hints.objetivo   = "recomposição";
  if (/(vegano|vegetariano|vegan)/.test(l))                             hints.dieta      = "vegetariano/vegano";
  if (/(iniciante|comecei|primeiro treino|nunca treinei)/.test(l))      hints.nivel      = "iniciante";
  if (/(avançado|avancado|anos de treino|treino há)/.test(l))           hints.nivel      = "avançado";
  if (/(cardio|aeróbico|aerobico|corrida|ciclismo|natação)/.test(l))    hints.interesses = [...(hints.interesses||[]),"cardio"];
  if (/(dieta|alimentação|alimentacao|proteína|proteina|caloria)/.test(l)) hints.interesses = [...(hints.interesses||[]),"dieta"];
  return hints;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const { message, history=[], userProfile={}, workoutLogs=[], profileSummary="" } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error:"Mensagem vazia."},{status:400});

    // Aceita chave do env (servidor) ou do header X-Groq-Key (enviada pelo client)
    const apiKey = process.env.GROQ_API_KEY || request.headers.get("x-groq-key") || "";
    if (!apiKey) return NextResponse.json({ error:"GROQ_API_KEY não configurada."},{status:500});

    // Busca paralela nas duas fontes
    const [videoChunks, exerciseChunks] = await Promise.all([
      Promise.resolve(searchVideos(message, 4)),
      Promise.resolve(searchExercises(message, 3)),
    ]);

    // Monta o contexto
    const hasVideos    = videoChunks.length > 0;
    const hasExercises = exerciseChunks.length > 0;

    const videoContext = hasVideos
      ? `\n\n--- CONTEXTO DOS VÍDEOS DOS INFLUENCIADORES ---\n` +
        videoChunks.map((c,i) =>
          `[Fonte ${i+1}: ${c.channel} — "${c.videoTitle}"]\n${c.text}`
        ).join("\n\n") +
        `\n--- FIM DO CONTEXTO DE VÍDEOS ---`
      : "";

    const exerciseContext = hasExercises
      ? `\n\n--- EXERCÍCIOS RELEVANTES DA BASE ---\n` +
        exerciseChunks.map(e =>
          `• ${e.name} (${e.muscles || "geral"}) — ${e.instructions}`
        ).join("\n") +
        `\n--- FIM DOS EXERCÍCIOS ---`
      : "";

    const profileStr = Object.keys(userProfile).length
      ? `\nPerfil do usuário: ${JSON.stringify(userProfile, null, 2)}`
      : "";

    // Memória de treinos recentes
    const workoutContext = formatRecentWorkouts(workoutLogs, 14) || "";

    // Resumo do perfil gerado anteriormente (texto livre)
    const profileContext = profileSummary
      ? `

Resumo do que aprendi sobre este usuário:
${profileSummary}`
      : "";

    const systemPrompt =
`Você é o HeavyDuty Coach, treinador pessoal de IA do app HeavyDutyOS.
Seu estilo é inspirado em Mike Mentzer: direto, técnico, baseado em evidências, sem enrolação.
Você domina: treino de força, hipertrofia, cardio, nutrição esportiva, suplementação e mentalidade atlética.
Responda sempre em português brasileiro. Seja objetivo, prático e específico.
${hasVideos ? "Priorize as informações do contexto de vídeos quando for relevante para a pergunta." : ""}
Quando indicar carga, séries ou repetições, seja específico (ex: 3x8-12 com 80% de 1RM).
Para temas médicos sérios (lesões, condições de saúde), sempre indique um profissional.

FORMATO OBRIGATÓRIO DA RESPOSTA:
- Use texto simples, sem asteriscos, sem markdown, sem negrito, sem itálico
- Para listas use traços simples: - item
- Para números use: 1. item
- Sem ** ou * em hipótese alguma
- Sem títulos com # ou ##
- Respostas diretas e curtas, máximo 3 parágrafos ou 6 itens de lista
- Se for listar alimentos ou exercícios, use no máximo 5 itens${profileStr}${videoContext}${exerciseContext}${workoutContext}${profileContext}`;

    // Strip any extra fields (sources, etc) — Groq só aceita role + content
    const cleanHistory = history.slice(-10).map(({ role, content }) => ({ role, content }));

    const messages = [
      { role: "system", content: systemPrompt },
      ...cleanHistory,
      { role: "user", content: message },
    ];

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization:`Bearer ${apiKey}`, "Content-Type":"application/json" },
      body: JSON.stringify({ model:MODEL, messages, max_tokens:800, temperature:0.65 }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error:`Groq: ${err}` }, { status:500 });
    }

    const data   = await res.json();
    const reply  = data.choices?.[0]?.message?.content ?? "";
    const profileUpdates = extractProfileHints(message);

    // Fontes: vídeos primeiro, depois exercícios
    const sources = [
      ...videoChunks.slice(0,2).map(c => ({
        type:"video", label:`${c.channel} — ${c.videoTitle}`, url: c.url
      })),
      ...exerciseChunks.slice(0,1).map(e => ({
        type:"exercise", label:e.name, muscles:e.muscles
      })),
    ];

    // A cada 10 mensagens do usuário, gerar um resumo do perfil
    let profileSummaryUpdate = null;
    const userMsgCount = history.filter(m => m.role === "user").length;
    if (userMsgCount > 0 && userMsgCount % 10 === 0) {
      try {
        const summaryRes = await fetch(GROQ_URL, {
          method: "POST",
          headers: { Authorization:`Bearer ${apiKey}`, "Content-Type":"application/json" },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant", max_tokens: 200, temperature: 0.3,
            messages: [
              { role:"system", content:"Você resume perfis de usuários de apps de treino em 3-5 frases em português. Seja específico sobre objetivo, nível, histórico e preferências." },
              { role:"user", content:`Com base nestas mensagens do usuário, resuma o perfil dele:
${history.filter(m=>m.role==="user").slice(-20).map(m=>m.content).join("\n")}` },
            ],
          }),
        });
        if (summaryRes.ok) {
          const sd = await summaryRes.json();
          profileSummaryUpdate = sd.choices?.[0]?.message?.content || null;
        }
      } catch {}
    }

    return NextResponse.json({ reply, sources, profileUpdates, profileSummaryUpdate });
  } catch(e) {
    console.error("[coach-chat]", e);
    return NextResponse.json({ error:"Erro interno." }, { status:500 });
  }
}
