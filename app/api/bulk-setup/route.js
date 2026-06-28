import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { image, fileContent, fileType } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A chave da API do Claude (ANTHROPIC_API_KEY) não está configurada no servidor. Por favor, adicione-a no arquivo .env.local para habilitar a importação rápida com IA!",
        },
        { status: 501 }
      );
    }

    let userContent = [];

    if (fileType === "image" && image) {
      // Extract base64 payload and mime type from image data URL
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json(
          { success: false, error: "Formato de imagem inválido." },
          { status: 400 }
        );
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      userContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType,
            data: base64Data,
          },
        },
        {
          type: "text",
          text: `Analise esta foto que contém um cronograma de treinos e/ou dieta semanal.
Extraia a programação para cada um dos 7 dias da semana (Segunda a Domingo) e mapeie para a estrutura do aplicativo.`,
        },
      ];
    } else if ((fileType === "text" || fileType === "json") && fileContent) {
      userContent = [
        {
          type: "text",
          text: `Analise o seguinte conteúdo de arquivo contendo a programação de treinos e/ou dieta semanal:
---
${fileContent}
---
Extraia a programação para cada um dos 7 dias da semana (Segunda a Domingo) e mapeie para a estrutura do aplicativo.`,
        },
      ];
    } else {
      return NextResponse.json(
        { success: false, error: "Dados de entrada incompletos." },
        { status: 400 }
      );
    }

    const systemPrompt = `Você é um assistente de musculação altamente especializado. Sua tarefa é extrair e estruturar a programação semanal de treino e dieta fornecida pelo usuário.
A resposta DEVE ser estritamente um JSON válido, sem markdown, sem explicações, contendo um objeto com a chave "schedule" mapeando exatamente os 7 dias da semana na ordem correta (Seg, Ter, Qua, Qui, Sex, Sab, Dom).

Regras da estrutura do JSON de resposta:
- A chave "schedule" deve ser um array com exatamente 7 objetos correspondentes aos dias: Seg, Ter, Qua, Qui, Sex, Sab, Dom nesta ordem.
- Cada objeto de dia deve conter os seguintes campos:
  - "day": a abreviação do dia exatamente como "Seg", "Ter", "Qua", "Qui", "Sex", "Sab" ou "Dom".
  - "type": o nome ou descrição simplificada do treino/atividade daquele dia (ex: "Push", "Pull", "Legs 🦵", "Jiu-Jitsu 🥋", "Descanso 🍕"). Se o dia for de repouso, use algo indicando descanso.
  - "color": uma cor em hexadecimal adequada para o dia. Tente usar cores marcantes:
    - Laranja (#f97316)
    - Azul (#3b82f6)
    - Roxo (#8b5cf6)
    - Verde (#10b981)
    - Amarelo (#f59e0b)
    - Rosa (#ec4899)
    - Vermelho (#ef4444)
    - Cinza (#6b7280) para dias de descanso.
  - "calType": define a meta calórica do dia e DEVE ser exatamente um desses três valores:
    - "normal": para dias normais de treino (2600 kcal)
    - "heavy": para dias de treinos pesados de perna ou alta intensidade (2800 kcal)
    - "free": para dias de descanso/livre
  - "group": o grupo de exercícios daquele dia para puxar os exercícios automáticos. DEVE ser estritamente um desses valores (ou null caso não tenha treino ou seja outro esporte): "Push", "Pull", "Legs", "Upper", "Lower" ou null.

Exemplo de resposta JSON esperada:
{
  "schedule": [
    {"day": "Seg", "type": "Push (Peito/Tríceps)", "color": "#f97316", "calType": "normal", "group": "Push"},
    {"day": "Ter", "type": "Pull (Costas/Bíceps)", "color": "#3b82f6", "calType": "normal", "group": "Pull"},
    {"day": "Qua", "type": "Legs Completo 🦵", "color": "#8b5cf6", "calType": "heavy", "group": "Legs"},
    {"day": "Qui", "type": "Upper Body (Superior)", "color": "#f59e0b", "calType": "normal", "group": "Upper"},
    {"day": "Sex", "type": "Lower 🦵", "color": "#ec4899", "calType": "heavy", "group": "Lower"},
    {"day": "Sab", "type": "Cardio Corrida 🏃", "color": "#10b981", "calType": "normal", "group": null},
    {"day": "Dom", "type": "Descanso Ativo 🍕", "color": "#6b7280", "calType": "free", "group": null}
  ]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              ...userContent,
              {
                type: "text",
                text: `${systemPrompt}\n\nAnalise o arquivo ou imagem enviada e retorne estritamente o JSON contendo os 7 dias mapeados de acordo com os detalhes fornecidos.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Claude bulk API error:", errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error?.message || "Falha na comunicação com o serviço Claude AI.",
        },
        { status: 502 }
      );
    }

    const responseData = await response.json();
    const text = responseData.content?.find((b) => b.type === "text")?.text || "";

    // Clean JSON markdown ticks if present
    const cleanText = text
      .trim()
      .replace(/^```json?/, "")
      .replace(/```$/, "")
      .trim();

    const parsedData = JSON.parse(cleanText);

    if (parsedData.schedule && Array.isArray(parsedData.schedule) && parsedData.schedule.length === 7) {
      return NextResponse.json({ success: true, schedule: parsedData.schedule });
    } else {
      throw new Error("Resposta da IA não está no formato de cronograma semanal válido.");
    }
  } catch (error) {
    console.error("Bulk setup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao processar cronograma." },
      { status: 500 }
    );
  }
}
