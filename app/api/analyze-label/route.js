import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { image, customName } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Imagem não fornecida." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn("ANTHROPIC_API_KEY environment variable is not defined.");
      return NextResponse.json(
        {
          success: false,
          error:
            "A chave da API do Claude (ANTHROPIC_API_KEY) não está configurada no servidor. Por favor, configure-a no arquivo .env.local ou nas configurações do seu ambiente.",
        },
        { status: 501 }
      );
    }

    // Extract base64 payload and mime type from data URL
    // e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    const matches = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json(
        { success: false, error: "Formato de imagem inválido." },
        { status: 400 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022", // Use a robust vision model
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
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
                text: `Você é um leitor de tabelas nutricionais. Analise esta imagem e extraia os valores nutricionais POR 100g do produto.
Responda SOMENTE com um JSON válido, sem texto adicional, sem blocos de código markdown, sem explicações:
{"name":"nome do produto ou vazio se não aparecer","kcal":0,"protein":0,"carbs":0,"fat":0}
Onde os valores são números decimais por 100g. Se não conseguir ler algum valor, use 0.`,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json();
      console.error("Anthropic API error:", errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error?.message || "Falha na comunicação com o serviço Claude AI.",
        },
        { status: 502 }
      );
    }

    const data = await anthropicResponse.json();
    const text = data.content?.find((b) => b.type === "text")?.text || "";

    // Parse JSON - handle possible surrounding markdown ticks
    const cleanText = text
      .trim()
      .replace(/^```json?/, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(cleanText);

    const productName = customName || parsed.name || "Produto Lido por IA";
    const food = {
      id: `ai_${Date.now()}`,
      name: productName,
      kcal: Math.round(parsed.kcal || 0),
      protein: Math.round((parsed.protein || 0) * 10) / 10,
      carbs: Math.round((parsed.carbs || 0) * 10) / 10,
      fat: Math.round((parsed.fat || 0) * 10) / 10,
      unit: "100g",
      scanned: true,
      aiRead: true,
    };

    return NextResponse.json({ success: true, food });
  } catch (error) {
    console.error("AI Nutrition scan error:", error);
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro ao processar a tabela nutricional." },
      { status: 500 }
    );
  }
}
