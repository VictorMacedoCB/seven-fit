#!/usr/bin/env node
/**
 * ─── SCRIPT OFFLINE ────────────────────────────────────────────────────────
 * Roda após o transcribe-videos.mjs.
 *
 * O que faz:
 *   Lê data/transcripts/*.json e gera data/knowledge-base.json,
 *   quebrando cada transcrição em chunks menores com overlap.
 *   O arquivo gerado é commitado no repo e usado pelo coach-chat em produção.
 *
 * Como rodar:
 *   node scripts/build-knowledge-base.mjs
 * ────────────────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";

const TRANSCRIPTS_DIR = "data/transcripts";
const OUTPUT          = "data/knowledge-base.json";

// Tamanho do chunk em palavras e sobreposição entre chunks adjacentes.
// Chunks menores = contexto mais preciso; chunks maiores = mais contexto por busca.
const CHUNK_WORDS   = 200;
const OVERLAP_WORDS = 40;

function chunkText(text) {
  const words  = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const end = Math.min(i + CHUNK_WORDS, words.length);
    chunks.push(words.slice(i, end).join(" "));
    if (end === words.length) break;
    i = end - OVERLAP_WORDS;
  }
  return chunks;
}

function main() {
  if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    console.error("Pasta data/transcripts não encontrada. Rode transcribe-videos.mjs primeiro.");
    process.exit(1);
  }

  const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith(".json"));
  if (!files.length) {
    console.error("Nenhuma transcrição encontrada. Rode transcribe-videos.mjs primeiro.");
    process.exit(1);
  }

  const kb = [];
  for (const file of files) {
    const data   = JSON.parse(fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), "utf-8"));
    const chunks = chunkText(data.text);

    chunks.forEach((text, idx) => {
      kb.push({
        id:         `${data.slug}-${idx}`,
        channel:    data.channel,
        videoTitle: data.videoTitle,
        url:        data.url,
        topics:     data.topics ?? [],
        chunkIndex: idx,
        text,
      });
    });

    console.log(`✓ ${data.videoTitle}: ${chunks.length} chunks`);
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(kb, null, 2));
  console.log(`\n✅ ${OUTPUT} gerado com ${kb.length} chunks de ${files.length} vídeo(s).`);
  console.log("   Faça commit deste arquivo para que o deploy use a base atualizada.");
}

main();
