#!/usr/bin/env node
/**
 * ─── SCRIPT OFFLINE ────────────────────────────────────────────────────────
 * Roda NA SUA MÁQUINA, não no servidor.
 *
 * Como rodar:
 *   node --env-file=.env.local scripts/transcribe-videos.mjs
 *
 * Pré-requisitos:
 *   Windows : winget install yt-dlp  &&  winget install Gyan.FFmpeg
 *             (feche e reabra o terminal depois de instalar)
 *   Mac     : brew install yt-dlp ffmpeg
 *   Linux   : sudo apt install yt-dlp ffmpeg
 * ────────────────────────────────────────────────────────────────────────────
 */

import { spawnSync } from "node:child_process";
import fs            from "node:fs";
import path          from "node:path";
import os            from "node:os";
import crypto        from "node:crypto";

const VIDEOS_FILE = "data/influencer-videos.json";
const TMP_DIR     = "data/.tmp-audio";
const TRANSCRIPTS = "data/transcripts";
const GROQ_URL    = "https://api.groq.com/openai/v1/audio/transcriptions";
const IS_WINDOWS  = os.platform() === "win32";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("❌ GROQ_API_KEY não encontrada no .env.local");
  console.error("   Crie sua chave grátis em https://console.groq.com/keys");
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Slug curto: máx 40 chars + hash de 6 chars para evitar colisão e path longo */
function makeSlug(channel, title) {
  const raw = `${channel}-${title}`
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const hash = crypto.createHash("md5").update(raw).digest("hex").slice(0, 6);
  return raw.slice(0, 40).replace(/-$/, "") + "-" + hash;
}

/** Remove o timestamp (?t=Xs ou &t=Xs) da URL do YouTube */
function cleanUrl(url) {
  return url.replace(/([?&])t=\d+s?/g, (_, sep) => sep === "?" ? "?" : "")
            .replace(/\?$/, "")
            .replace(/&$/, "");
}

/** Procura o arquivo de áudio baixado (yt-dlp pode gerar extensões variadas) */
function findAudioFile(base) {
  for (const ext of ["mp3", "m4a", "webm", "opus", "ogg", "wav"]) {
    const p = `${base}.${ext}`;
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Verifica se um executável está disponível.
 * No Windows usa `where`, no Unix usa `which`.
 */
function commandExists(cmd) {
  const result = IS_WINDOWS
    ? spawnSync("where", [cmd], { shell: true,  encoding: "utf8" })
    : spawnSync("which", [cmd], { shell: false, encoding: "utf8" });
  return result.status === 0;
}

// ── Download ─────────────────────────────────────────────────────────────────

function downloadAudio(url, outBase) {
  if (!commandExists("yt-dlp")) {
    console.error("\n❌ yt-dlp não encontrado no PATH.");
    if (IS_WINDOWS) {
      console.error("   1. Abra o PowerShell como Administrador e rode:");
      console.error("      winget install yt-dlp");
      console.error("      winget install Gyan.FFmpeg");
      console.error("   2. Feche TODOS os terminais e abra um novo.");
    } else {
      console.error("   Mac:   brew install yt-dlp ffmpeg");
      console.error("   Linux: sudo apt install yt-dlp ffmpeg");
    }
    process.exit(1);
  }

  const existing = findAudioFile(outBase);
  if (existing) {
    console.log(`  ↳ áudio já existe (${path.basename(existing)}), pulando`);
    return existing;
  }

  const cleanedUrl = cleanUrl(url);
  if (cleanedUrl !== url) console.log(`  ↳ timestamp removido da URL`);

  console.log("  ↳ baixando áudio...");

  const args = [
    "-x",
    "--audio-format", "mp3",
    "--audio-quality", "5",
    "--no-playlist",
    "--socket-timeout", "30",
    "--retries", "3",
    // No Windows, força o ffmpeg via PATH (winget instala separado)
    ...(IS_WINDOWS ? ["--ffmpeg-location", "ffmpeg"] : []),
    "-o", `${outBase}.%(ext)s`,
    cleanedUrl,
  ];

  const result = spawnSync("yt-dlp", args, {
    stdio:   "inherit",
    shell:   IS_WINDOWS, // no Windows precisa de shell pra resolver o PATH do winget
    timeout: 600_000,
  });

  if (result.error) {
    throw new Error(`Erro ao executar yt-dlp: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(
      `yt-dlp saiu com código ${result.status}.\n` +
      `  → Tente rodar manualmente:\n` +
      `    yt-dlp -x --audio-format mp3 -o "data/.tmp-audio/teste.%(ext)s" "${cleanedUrl}"`
    );
  }

  const audioFile = findAudioFile(outBase);
  if (!audioFile) throw new Error("yt-dlp rodou mas nenhum arquivo de áudio foi encontrado.");
  return audioFile;
}

// ── Transcrição ───────────────────────────────────────────────────────────────

async function transcribe(audioPath) {
  const stats  = fs.statSync(audioPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
  console.log(`  ↳ transcrevendo com Whisper Large v3 — Groq (${sizeMB} MB)...`);

  if (stats.size > 24 * 1024 * 1024) {
    console.warn("  ⚠️  Arquivo > 24 MB (limite do Groq Whisper). Pode falhar.");
  }

  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(audioPath)]), path.basename(audioPath));
  form.append("model", "whisper-large-v3");
  form.append("language", "pt");
  form.append("response_format", "verbose_json");

  const res = await fetch(GROQ_URL, {
    method:  "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body:    form,
  });

  if (!res.ok) throw new Error(`Whisper error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(TMP_DIR,     { recursive: true });
  fs.mkdirSync(TRANSCRIPTS, { recursive: true });

  if (!fs.existsSync(VIDEOS_FILE)) {
    console.error(`❌ Arquivo não encontrado: ${VIDEOS_FILE}`);
    process.exit(1);
  }

  const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, "utf-8"));
  if (!videos.length) { console.log("Nenhum vídeo para processar."); return; }

  let ok = 0, skip = 0, fail = 0;

  for (const v of videos) {
    // slug curto para evitar paths longos no Windows
    const slug = makeSlug(v.channel, v.videoTitle);
    const dest = path.join(TRANSCRIPTS, `${slug}.json`);

    if (fs.existsSync(dest)) {
      console.log(`✓ já transcrito: ${v.videoTitle}`);
      skip++;
      continue;
    }

    console.log(`\n▶ ${v.videoTitle}  [${v.channel}]`);

    try {
      const outBase   = path.join(TMP_DIR, slug);
      const audioPath = downloadAudio(v.url, outBase);
      const result    = await transcribe(audioPath);

      fs.writeFileSync(dest, JSON.stringify({
        slug, channel: v.channel, videoTitle: v.videoTitle,
        url: v.url, topics: v.topics ?? [],
        text: result.text, segments: result.segments ?? [],
      }, null, 2));

      try { fs.unlinkSync(audioPath); } catch {}
      console.log(`  ✓ salvo → ${dest}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ERRO: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Concluído: ${ok} transcritos · ${skip} pulados · ${fail} erros`);
  if (ok > 0) console.log("\nPróximo passo: node scripts/build-knowledge-base.mjs");
}

main();
