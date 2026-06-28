import { NextResponse } from "next/server";

/**
 * POST /api/add-video
 * Body: { url, channel, videoTitle, topics[] }
 *
 * Baixa + transcreve um vídeo do YouTube e adiciona à base do Coach.
 * Requer GROQ_API_KEY. Funciona localmente (com yt-dlp instalado).
 * Na Vercel retorna erro claro pedindo o script offline.
 */
export async function POST(req) {
  const { url, channel, videoTitle, topics = [] } = await req.json();
  if (!url || !channel || !videoTitle)
    return NextResponse.json({ error:"url, channel e videoTitle são obrigatórios."},{status:400});

  // Aceita chave do env (servidor) ou do header X-Groq-Key (enviada pelo client via localStorage)
  const apiKey = process.env.GROQ_API_KEY || req.headers.get("x-groq-key") || "";
  if (!apiKey)
    return NextResponse.json({ error:"GROQ_API_KEY não configurada. Adicione nas Configurações do app ou no .env.local"},{status:500});

  // Serverless (Vercel) não tem yt-dlp — orienta o usuário
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    return NextResponse.json({
      error:"Ambiente serverless detectado. Para adicionar vídeos use o script local:\n\nnode --env-file=.env.local scripts/transcribe-videos.mjs\n\nApós rodar, faça commit do data/knowledge-base.json gerado.",
      useScript: true
    },{status:501});
  }

  // Ambiente local — importa módulos Node dinamicamente
  try {
    const { execSync } = await import("node:child_process");
    const fs            = (await import("node:fs")).default;
    const path          = (await import("node:path")).default;

    const TRANSCRIPTS = path.resolve("data/transcripts");
    const TMP         = path.resolve("data/.tmp-audio");
    const KB_FILE     = path.resolve("data/knowledge-base.json");
    const CHUNK_WORDS = 200;
    const OVERLAP     = 40;

    const slugify = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,70);

    const chunkText = text => {
      const words=[]; const out=[];
      text.split(/\s+/).filter(Boolean).forEach(w=>words.push(w));
      let i=0;
      while(i<words.length){const e=Math.min(i+CHUNK_WORDS,words.length);out.push(words.slice(i,e).join(" "));if(e===words.length)break;i=e-OVERLAP;}
      return out;
    };

    fs.mkdirSync(TRANSCRIPTS,{recursive:true});
    fs.mkdirSync(TMP,{recursive:true});

    const slug     = slugify(`${channel}-${videoTitle}`);
    const destFile = path.join(TRANSCRIPTS,`${slug}.json`);
    if (fs.existsSync(destFile))
      return NextResponse.json({message:"Vídeo já transcrito.",slug});

    // 1. Baixar áudio
    const audioOut = path.join(TMP,`${slug}.mp3`);
    execSync(`yt-dlp -x --audio-format mp3 --audio-quality 5 -o "${path.join(TMP,slug)}.%(ext)s" "${url}"`,{stdio:"inherit",timeout:300000});

    // 2. Transcrever via Groq Whisper
    const bytes = fs.readFileSync(audioOut);
    const form  = new FormData();
    form.append("file",new Blob([bytes]),`${slug}.mp3`);
    form.append("model","whisper-large-v3");
    form.append("language","pt");
    form.append("response_format","verbose_json");

    const wr = await fetch("https://api.groq.com/openai/v1/audio/transcriptions",
      {method:"POST",headers:{Authorization:`Bearer ${apiKey}`},body:form});
    if (!wr.ok) throw new Error(`Whisper ${wr.status}: ${await wr.text()}`);
    const wdata = await wr.json();

    fs.writeFileSync(destFile,JSON.stringify({slug,channel,videoTitle,url,topics,text:wdata.text,segments:wdata.segments??[]},null,2));
    try{fs.unlinkSync(audioOut);}catch{}

    // 3. Reconstruir knowledge-base.json
    const files = fs.readdirSync(TRANSCRIPTS).filter(f=>f.endsWith(".json"));
    const kb=[];
    for(const f of files){
      const d=JSON.parse(fs.readFileSync(path.join(TRANSCRIPTS,f),"utf-8"));
      chunkText(d.text).forEach((text,idx)=>kb.push({id:`${d.slug}-${idx}`,channel:d.channel,videoTitle:d.videoTitle,url:d.url,topics:d.topics??[],chunkIndex:idx,text}));
    }
    fs.writeFileSync(KB_FILE,JSON.stringify(kb,null,2));

    return NextResponse.json({message:"Transcrito com sucesso!",slug,totalChunks:kb.length,totalVideos:files.length});
  } catch(e) {
    return NextResponse.json({error:e.message},{status:500});
  }
}
