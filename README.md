<div align="center">

<img src="public/logo.svg" width="80" alt="HeavyDutyOS logo"/>

# HeavyDutyOS

**Treino de alta intensidade ao estilo Mike Mentzer.**  
Registre, evolua, domine.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![Supabase](https://img.shields.io/badge/Supabase-green?logo=supabase)
![Groq](https://img.shields.io/badge/Groq_AI-free-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## ✨ Funcionalidades

- 🏋️ **Treino** — sessões com registro de séries, histórico e volume acumulado
- 🥗 **Dieta** — macros automáticos no método Mentzer (60% carb · 25% prot · 15% gord)
- 📊 **Dashboard** — visão geral de metas calóricas por objetivo (Cutting / Bulking / Manutenção)
- 🤖 **HeavyDuty Coach** — chat de IA treinado com vídeos de influenciadores fitness
- 📋 **Guia de exercícios** — imagem animada + instruções passo a passo em PT-BR
- ✨ **IA monta plano** — gera uma semana completa de treinos baseada nos seus objetivos
- 🎙️ **Aprenda com vídeos** — cole um link do YouTube e o Coach aprende com aquele conteúdo
- 📱 **PWA** — instale como app no Android ou iPhone, sem App Store

---

## 🚀 Setup local

### Pré-requisitos
- Node.js 18+
- Conta Supabase (opcional — para sync em nuvem)
- Chave Groq (opcional — para o Coach de IA)

### Instalação

```bash
git clone https://github.com/SEU_USER/heavydutyos.git
cd heavydutyos
npm install
```

Crie o arquivo `.env.local`:

```env
# Groq — Coach de IA e transcrição de vídeos (grátis em console.groq.com/keys)
GROQ_API_KEY=gsk_...

# Supabase — sync entre dispositivos (opcional)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Claude — guia de exercícios por IA (opcional, Groq é usado como fallback)
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npm run dev
# Acesse http://localhost:3000
```

> **Sem nenhuma variável de ambiente o app funciona.** Você pode inserir sua chave Groq direto nas Configurações do app — ela fica salva no seu dispositivo.

---

## 📁 Estrutura

```
app/
  page.js                    # App principal
  api/
    coach-chat/route.js      # Coach de IA (Groq + base de vídeos)
    exercise-guide/route.js  # Guia de exercício (PT-BR, IA)
    add-video/route.js       # Transcrição automática de vídeos
    ...
components/
  WorkoutTab.jsx             # Aba de treino
  DietTab.jsx                # Aba de dieta
  SettingsTab.jsx            # Configurações e macros
  CoachChatModal.jsx         # Chat do Coach de IA
  ExerciseGuideModal.jsx     # Guia de execução
  AiPlanModal.jsx            # IA monta plano semanal
  AddVideoModal.jsx          # Adicionar vídeo ao Coach
  HeavyDutyLogo.jsx          # Logo do bigode (Mike Mentzer)
  Header.jsx                 # Header com logo dinâmica
lib/
  exercises-ptbr.json        # 873 exercícios em PT-BR com instruções
  supabase.js                # Cliente Supabase
data/
  knowledge-base.json        # Base de conhecimento dos vídeos (gerada pelos scripts)
  influencer-videos.json     # Lista de vídeos para transcrever
scripts/
  transcribe-videos.mjs      # Baixa e transcreve vídeos (roda local)
  build-knowledge-base.mjs   # Gera knowledge-base.json dos transcritos
```

---

## 🎙️ Treinar o Coach com vídeos

### Opção 1 — No próprio app (ambiente local)
1. Abra o app → botão 🎙️ no canto da tela
2. Cole o link do YouTube, preencha canal e título
3. Clique em "Transcrever e Treinar Coach"

### Opção 2 — Script offline (para a Vercel)
```bash
# 1. Preencha data/influencer-videos.json com os links
# 2. Rode o script (precisa do yt-dlp instalado)
node --env-file=.env.local scripts/transcribe-videos.mjs

# 3. Gere a base de conhecimento
node scripts/build-knowledge-base.mjs

# 4. Faça commit do arquivo gerado
git add data/knowledge-base.json
git commit -m "feat: adicionar vídeos ao knowledge base"
git push
```

Instalar yt-dlp:
```bash
# Windows
winget install yt-dlp && winget install Gyan.FFmpeg

# Mac
brew install yt-dlp ffmpeg

# Linux
sudo apt install yt-dlp ffmpeg
```

---

## 🌐 Deploy (Vercel — Gratuito)

1. Fork este repositório
2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → importe o fork
3. Adicione as variáveis de ambiente no painel da Vercel
4. Deploy automático a cada `git push`

---

## 📱 Instalar como app no celular

**Android:** Chrome → menu ⋮ → "Adicionar à tela inicial"  
**iPhone:** Safari → compartilhar ↑ → "Adicionar à Tela de Início"

---

## 🙏 Créditos

- Método Heavy Duty — **Mike Mentzer**
- Base de exercícios — [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
- IA — [Groq](https://groq.com) (Llama 3.3 70B) + [Whisper Large v3](https://openai.com/research/whisper)
- Hosting — [Vercel](https://vercel.com)
- Banco de dados — [Supabase](https://supabase.com)
