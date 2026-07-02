import { NextResponse } from "next/server";
import exercisesDb from "../../../lib/exercises-ptbr.json";
import { findBestExerciseMatch, normalizeExerciseName } from "../../../lib/exerciseMatch";

// Mapeamento: nome usado no app → nome exato no exercises-ptbr.json
const APP_TO_DB = {
  "Supino Reto":                      "Supino Reto com Barra - Pegada Média",
  "Supino Inclinado":                 "Supino Inclinado com Barra - Pegada Média",
  "Supino Declinado":                 "Supino Declinado com Barra",
  "Crucifixo":                        "Crucifixo com Halteres",
  "Crucifixo Inclinado":              "Crucifixo Inclinado com Halteres",
  "Pec Deck":                         "Butterfly",
  "Crossover":                        "Crossover na Polia",
  "Desenvolvimento com Barra":        "Desenvolvimento Militar com Barra",
  "Desenvolvimento com Halteres":     "Press Arnold com Halteres",
  "Elevação Lateral":                 "Elevação Lateral",
  "Elevação Frontal":                 "Elevação Frontal com Halteres",
  "Encolhimento":                     "Encolhimento de Ombros com Barra",
  "Face Pull":                        "Face Pull",
  "Tríceps Corda":                    "Tríceps Pulley com Corda",
  "Tríceps Testa":                    "Tríceps Skull Crusher com Banda",
  "Tríceps Francês":                  "Extensão de Tríceps Atrás da Cabeça com Corda",
  "Tríceps Banco":                    "Mergulho no Banco",
  "Mergulho":                         "Mergulho - Versão Peitoral",
  "Extensão Tríceps":                 "Extensão de Tríceps Inclinada na Polia",
  "Puxada Frente":                    "Pulldown com Amplitude Completa",
  "Puxada Neutra":                    "Pulldown Frente em Pegada Fechada",
  "Puxada Fechada":                   "Pulldown Frente em Pegada Fechada",
  "Barra Fixa":                       "Barra Fixa",
  "Pullover":                         "Pullover com Halter e Braços Flexionados",
  "Remada Curvada":                   "Remada Curvada com Barra",
  "Remada Unilateral":                "Remada Curvada com Dois Halteres",
  "Remada Cavalinho":                 "Remada T-Bar Deitado",
  "Remada Sentado":                   "Remada Sentada no Pulley",
  "Serrote":                          "Remada Curvada com Dois Halteres",
  "Rosca Direta":                     "Rosca Direta com Barra",
  "Rosca Martelo":                    "Rosca Martelo",
  "Rosca Concentrada":                "Rosca Concentrada",
  "Rosca Scott":                      "Rosca Scott",
  "Rosca Inversa":                    "Rosca Inversa com Barra",
  "Rosca 21":                         "Rosca Direta com Barra",
  "Crucifixo Invertido com Halteres": "Crucifixo Invertido com Banda",
  "Crucifixo Invertido na Máquina":   "Crucifixo Inverso na Polia",
  "Agachamento Livre":                "Agachamento com Barra",
  "Agachamento Smith":                "Agachamento no Smith",
  "Agachamento Sumô":                 "Agachamento Sumo",
  "Leg Press":                        "Leg Press",
  "Hack Squat":                       "Agachamento Hack com Barra",
  "Cadeira Extensora":                "Extensão de Pernas",
  "Mesa Flexora":                     "Cadeira Flexora",
  "Cadeira Adutora":                  "Adutor de Coxas",
  "Cadeira Abdutora":                 "Abdutor de Coxas",
  "Stiff":                            "Stiff-Legged Deadlift no Smith",
  "Avanço":                           "Afundo com Halteres",
  "Avanço com Barra":                 "Afundo com Barra",
  "Agachamento Búlgaro":              "Afundo Reverso Cruzado",
  "Panturrilha em Pé":                "Elevação de Panturrilha com Halter",
  "Panturrilha Sentado":              "Elevação de Panturrilha Sentado com Barra",
  "Panturrilha no Leg Press":         "Press de Panturrilha na Máquina de Leg Press",

  // Complementares (Abdômen, Panturrilha, Lombar)
  "Prancha":                          "Prancha",
  "Abdominal na Polia":               "Abdominal na Polia",
  "Abdominal Infra":                  "Abdominal Infra na Polia",
  "Elevação de Pernas":               "Elevação de Pernas na Barra",
  "Roda Abdominal":                   "Roda Abdominal",
  "Abdominal Bicicleta":              "Bicicleta no Ar",
  "Abdominal Oblíquo":                "Abdominais Oblíquos",
  "Hiperextensão Lombar":             "Hiperextensões (Extensões Lombares)",
};

// Rich local database of fallbacks for the core exercises to guarantee immediate, offline-compatible operation!
const FALLBACK_EXERCISES = {
  "Supino Reto": {
    musclePrimary: "Peitoral Maior",
    muscleSecondary: "Tríceps Braquial, Deltoide Anterior",
    setup: [
      "Deite-se no banco plano com os olhos diretamente sob a barra.",
      "Segure a barra com uma pegada ligeiramente mais larga que a largura dos ombros.",
      "Mantenha os pés firmes no chão, glúteos encostados no banco e contraia as escápulas (retração escapular)."
    ],
    execution: [
      "Retire a barra do suporte de forma segura e posicione-a acima do peito com os braços estendidos.",
      "Desça a barra de forma controlada até tocar suavemente a linha do peito.",
      "Empurre a barra de volta para cima com força, estendendo os braços, mantendo o peito estufado e ombros para trás."
    ],
    mistakes: [
      "Bater a barra com força no peito para pegar impulso.",
      "Tirar os glúteos do banco ou os pés do chão durante o movimento.",
      "Abrir excessivamente os cotovelos a 90 graus (o ideal é mantê-los a cerca de 60-75 graus do tronco)."
    ],
    proTip: "Imagine que está tentando 'quebrar a barra' ao meio com as mãos. Isso trava os cotovelos na rotação interna ideal e ativa intensamente as fibras do peitoral."
  },
  "Agachamento Livre": {
    musclePrimary: "Quadríceps, Glúteo Máximo",
    muscleSecondary: "Posteriores de Coxa, Eretores da Espinha, Abdomen",
    setup: [
      "Posicione a barra sobre a porção superior do trapézio (não no pescoço) e segure firmemente com as mãos.",
      "Retire a barra do suporte dando um passo para trás e afaste os pés na largura dos ombros, com as pontas dos pés levemente apontadas para fora.",
      "Mantenha o olhar para frente, o peito aberto e contraia firmemente o abdômen."
    ],
    execution: [
      "Inicie o movimento projetando o quadril levemente para trás, como se fosse sentar em uma cadeira.",
      "Agache flexionando os joelhos até que as coxas fiquem pelo menos paralelas ao chão (ou abaixo se tiver flexibilidade).",
      "Suba empurrando o chão com a força dos calcanhares, mantendo as costas retas até retornar à posição inicial."
    ],
    mistakes: [
      "Permitir que os joelhos apontem para dentro (valgo dinâmico) ao subir.",
      "Tirar os calcanhares do chão ou curvar a lombar (arredondar as costas).",
      "Iniciar o movimento flexionando primeiro os joelhos em vez do quadril."
    ],
    proTip: "Mantenha o abdômen altamente pressurizado (manobra de Valsalva) durante a descida para criar um 'cinturão natural' protetor para a sua lombar."
  },
  "Puxada Frente": {
    musclePrimary: "Latíssimo do Dorso (Dorsal)",
    muscleSecondary: "Bíceps Braquial, Braquiorradial, Redondo Maior, Trapézio",
    setup: [
      "Ajuste o rolo de suporte para as coxas firmemente sobre as pernas.",
      "Segure a barra com pegada pronada aberta (mais larga que os ombros) e sente-se.",
      "Mantenha o tronco reto e incline o tronco ligeiramente para trás (cerca de 10-15 graus)."
    ],
    execution: [
      "Inicie o movimento puxando os cotovelos para baixo e para trás, de forma a trazer a barra em direção ao peito superior.",
      "Contraia firmemente as costas no ponto máximo do movimento, segurando por meio segundo.",
      "Retorne a barra lentamente até a posição inicial, sentindo o alongamento completo do músculo dorsal."
    ],
    mistakes: [
      "Usar impulso excessivo balançando o tronco para trás (roubo).",
      "Puxar a barra com a força exclusiva dos braços/bíceps em vez das costas.",
      "Trazer a barra por trás do pescoço (coloca o ombro em uma posição biomecanicamente instável)."
    ],
    proTip: "Imagine que suas mãos são apenas 'ganchos' e que você está puxando o peso focando estritamente em esmagar os cotovelos para baixo, em direção ao seu quadril."
  },
  "Desenvolvimento": {
    musclePrimary: "Deltoide Anterior (Ombros)",
    muscleSecondary: "Tríceps Braquial, Deltoide Lateral, Trapézio, Peitoral Superior",
    setup: [
      "Ajuste o banco para 90 graus (ou leve inclinação de 80 graus) e sente-se firmemente com as costas apoiadas.",
      "Segure os halteres à altura dos ombros, com as palmas voltadas para a frente e cotovelos posicionados logo abaixo das mãos.",
      "Mantenha os pés firmes no chão e contraia o abdômen."
    ],
    execution: [
      "Empurre os halteres para cima de forma controlada até que os braços fiquem quase estendidos acima da cabeça.",
      "Evite encostar os halteres no topo para manter a tensão constante no ombro.",
      "Desça os halteres lentamente até que fiquem ligeiramente abaixo da linha do queixo, alongando os ombros."
    ],
    mistakes: [
      "Estender os cotovelos excessivamente a ponto de 'travar' a articulação no topo.",
      "Bater os halteres um no outro no topo da repetição.",
      "Arquear exageradamente a lombar para compensar cargas pesadas."
    ],
    proTip: "Ao descer, mantenha os cotovelos levemente projetados para a frente em vez de totalmente abertos para os lados. Isso protege o manguito rotador e otimiza a linha de força dos ombros."
  },
  "Rosca Direta": {
    musclePrimary: "Bíceps Braquial",
    muscleSecondary: "Braquial, Braquiorradial, Antebraço",
    setup: [
      "Fique em pé com os pés na largura do quadril e joelhos levemente destravados.",
      "Segure a barra (reta ou W) com as palmas voltadas para cima na largura dos ombros.",
      "Mantenha os braços estendidos ao lado do corpo e os cotovelos alinhados ao tronco."
    ],
    execution: [
      "Mantendo os cotovelos fixos ao lado do corpo, flexione os braços levando a barra em direção ao peito.",
      "Suba apenas até que o antebraço fique quase vertical, esmagando o bíceps no topo.",
      "Desça a barra lentamente de forma totalmente controlada até que os braços fiquem estendidos."
    ],
    mistakes: [
      "Balançar o corpo para trás e para frente (impulso lombar) para levantar a carga.",
      "Projetar os cotovelos para frente durante a subida (divide o esforço com o deltoide anterior).",
      "Não realizar a extensão completa do braço na descida (reduz a amplitude e estimulação)."
    ],
    proTip: "Mantenha os punhos firmes e ligeiramente flexionados para trás durante o movimento para isolar ao máximo a contração no bíceps e reduzir a fadiga nos antebraços."
  },
  "Tríceps Corda": {
    musclePrimary: "Tríceps Braquial (Cabeça Lateral e Longa)",
    muscleSecondary: "Ancôneo, Antebraços",
    setup: [
      "Prenda a corda na polia alta do crossover.",
      "Segure as pontas da corda, dê um passo para trás e incline levemente o tronco para a frente com os joelhos destravados.",
      "Posicione os cotovelos grudados nas costelas, flexionados a 90 graus."
    ],
    execution: [
      "Estenda os braços empurrando as pontas da corda em direção ao chão de forma controlada.",
      "No final do movimento, afaste as pontas da corda uma da outra (rotação externa), esmagando o tríceps.",
      "Suba a corda de forma controlada até retornar os antebraços à posição de 90 graus."
    ],
    mistakes: [
      "Abrir os cotovelos para os lados (devem permanecer fixos apontados para o chão).",
      "Usar o peso do corpo para empurrar o cabo para baixo (ombros caídos).",
      "Subir a corda excessivamente a ponto de perder a tensão constante no tríceps."
    ],
    proTip: "No final da descida, force a extensão do dedinho para fora. Essa rotação de punho recruta intensamente a porção lateral do tríceps, gerando maior densidade muscular."
  }
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawName = searchParams.get("name");

  if (!rawName) {
    return NextResponse.json(
      { success: false, error: "Nome do exercício não fornecido." },
      { status: 400 }
    );
  }

  const name = rawName.trim();
  const apiKey = process.env.ANTHROPIC_API_KEY || request.headers?.get?.("x-groq-key") || "";

  // 1. Try to search in our localized fallback database
  // Match ignoring case and accents
  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const normalizedQuery = normalize(name);
  const matchedKey = Object.keys(FALLBACK_EXERCISES).find(
    (key) => normalize(key) === normalizedQuery || normalizedQuery.includes(normalize(key))
  );

  if (matchedKey) {
    const getDbMatchName = (exName) => {
      const map = {
        "Puxada Frente": "Pulldown com Pegada Larga",
        "Desenvolvimento": "Desenvolvimento de Ombros com Halteres",
        "Tríceps Corda": "Tríceps Corda Acima da Cabeça",
        "Supino Reto": "Supino Reto com Barra - Pegada Média",
        "Agachamento Livre": "Agachamento Livre com Barra",
        "Rosca Direta": "Rosca Direta com Barra"
      };
      return map[exName] || exName;
    };
    const searchName = getDbMatchName(matchedKey);
    const dbMatch = findBestExerciseMatch(searchName, exercisesDb);
    return NextResponse.json({
      success: true,
      guide: {
        ...FALLBACK_EXERCISES[matchedKey],
        images: dbMatch ? dbMatch.images : []
      },
      source: "local",
    });
  }

  // 1.5. Try to search in the downloaded Pt-Br exercises database
  const mappedName = APP_TO_DB[name] || name;
  const dbMatch = findBestExerciseMatch(mappedName, exercisesDb);

  if (dbMatch) {
    const translateMuscle = (m) => {
      const dict = {
        'abdominais': 'Abdominais',
        'isquiotibiais': 'Isquiotibiais (Posterior de Coxa)',
        'adutores': 'Adutores',
        'quadriceps': 'Quadríceps',
        'biceps': 'Bíceps',
        'ombros': 'Ombros (Deltoides)',
        'peito': 'Peito (Peitoral)',
        'meio-das-costas': 'Dorsal (Meio das Costas)',
        'panturrilhas': 'Panturrilhas',
        'gluteos': 'Glúteos',
        'inferior-das-costas': 'Lombar (Inferior das Costas)',
        'dorsais': 'Dorsais / Asa',
        'triceps': 'Tríceps',
        'trapezio': 'Trapézio',
        'antebracos': 'Antebraços',
        'pescoco': 'Pescoço',
        'abdutores': 'Abdutores'
      };
      return dict[m] || m;
    };

    const translateEquipment = (eq) => {
      const dict = {
        'peso-do-corpo': 'Peso do corpo',
        'maquina': 'Máquina',
        'outros': 'Outros equipamentos',
        'rolo-de-espuma': 'Rolo de espuma',
        'kettlebell': 'Kettlebell',
        'halteres': 'Halteres',
        'cabo': 'Polia/Cabo',
        'barra': 'Barra',
        'faixas': 'Faixas elásticas',
        'bola-medicinal': 'Bola medicinal',
        'bola-de-exercicio': 'Bola de exercício',
        'barra-w': 'Barra W'
      };
      return dict[eq] || eq || 'Peso do corpo';
    };

    const setupSteps = dbMatch.instructions.slice(0, Math.ceil(dbMatch.instructions.length / 2));
    const executionSteps = dbMatch.instructions.slice(Math.ceil(dbMatch.instructions.length / 2));

    return NextResponse.json({
      success: true,
      guide: {
        musclePrimary: dbMatch.primaryMuscles.map(translateMuscle).join(", "),
        muscleSecondary: dbMatch.secondaryMuscles.map(translateMuscle).join(", "),
        setup: setupSteps.length > 0 ? setupSteps : ["Posicione-se conforme anatomia do exercício."],
        execution: executionSteps.length > 0 ? executionSteps : ["Realize o movimento com amplitude completa."],
        instructions: dbMatch.instructions,
        images: dbMatch.images || [],
        mistakes: ["Executar o movimento sem controle ou com excesso de carga."],
        proTip: `Foque no controle de movimento utilizando o equipamento: ${translateEquipment(dbMatch.equipment)}.`
      },
      source: "local-db"
    });
  }

  // 2. If not matched locally and we have the Claude API Key, generate it dynamically!
  if (apiKey) {
    console.log(`Exercise "${name}" not found locally. Fetching execution guide via Claude AI...`);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 600,
          messages: [
            {
              role: "user",
              content: `Você é um Personal Trainer e especialista em biomecânica da musculação.
Gere um guia de execução detalhado, seguro e profissional para o exercício de musculação chamado "${name}".
O retorno DEVE ser EXCLUSIVAMENTE um JSON válido, sem explicações, sem introduções e sem markdown:
{
  "musclePrimary": "Nome do músculo alvo principal (ex: Peitoral Maior)",
  "muscleSecondary": "Músculos secundários (ex: Tríceps Braquial, Deltoide Anterior)",
  "setup": [
    "Passo 1 de preparação e posicionamento do corpo",
    "Passo 2 de preparação",
    "Passo 3 de preparação"
  ],
  "execution": [
    "Passo 1 de execução e fase concêntrica/excêntrica",
    "Passo 2 de execução",
    "Passo 3 de execução"
  ],
  "mistakes": [
    "Erro comum 1 que pode lesionar ou reduzir eficiência",
    "Erro comum 2",
    "Erro comum 3"
  ],
  "proTip": "Dica de ouro ou segredo biomecânico para maximizar os ganhos ou isolamento muscular."
}
Use terminologias brasileiras comuns de academia (musculação do Brasil). Certifique-se de que os passos sejam curtos, concisos e fáceis de ler no celular.`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.find((b) => b.type === "text")?.text || "";
        const cleanText = text
          .trim()
          .replace(/^```json?/, "")
          .replace(/```$/, "")
          .trim();

        const parsed = JSON.parse(cleanText);

        if (
          parsed.musclePrimary &&
          parsed.setup?.length &&
          parsed.execution?.length &&
          parsed.mistakes?.length
        ) {
          return NextResponse.json({
            success: true,
            guide: parsed,
            source: "ai",
          });
        }
      }
    } catch (aiError) {
      console.error("AI exercise guide fetch failed:", aiError);
    }
  }

  // 3. Ultimate backup generic instructions if not found and no AI key or AI failed
  const genericGuide = {
    musclePrimary: "Geral / Músculo Alvo",
    muscleSecondary: "Músculos Estabilizadores",
    setup: [
      "Ajuste o equipamento de acordo com a sua altura.",
      "Posicione as articulações de forma anatômica e confortável.",
      "Mantenha a postura ereta e o abdômen contraído antes de iniciar."
    ],
    execution: [
      "Realize a fase concêntrica (puxar/empurrar) soltando o ar (expiração) de forma controlada.",
      "Segure brevemente a contração muscular máxima no pico do movimento.",
      "Retorne lentamente na fase excêntrica (descida/alongamento) inspirando o ar."
    ],
    mistakes: [
      "Utilizar excesso de carga sacrificando a postura (roubo corporal excessivo).",
      "Não realizar a amplitude de movimento total segura.",
      "Fazer o movimento de forma muito rápida e sem controle excêntrico."
    ],
    proTip: "Concentre-se na conexão mente-músculo. Sinta o músculo trabalhar e se alongar em vez de apenas pensar em mover o peso de um ponto A para um ponto B."
  };

  return NextResponse.json({
    success: true,
    guide: genericGuide,
    source: "generic",
    message: !apiKey ? "Configure ANTHROPIC_API_KEY no arquivo .env.local para ativar guias inteligentes com IA para todos os exercícios!" : null
  });
}
