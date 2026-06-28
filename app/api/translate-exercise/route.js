import { NextResponse } from "next/server";

/**
 * POST /api/translate-exercise
 * Body: { instructions: string[] }
 * Retorna: { translated: string[] }
 * Traduz instruções de exercício EN→PT-BR via Groq (llama-3.1-8b-instant).
 */
export async function POST(request) {
  try {
    const { instructions } = await request.json();
    if (!Array.isArray(instructions) || !instructions.length)
      return NextResponse.json({ translated: [] });

    const apiKey = process.env.GROQ_API_KEY || request.headers.get("x-groq-key") || "";
    if (!apiKey) return NextResponse.json({ translated: instructions });

    const numbered = instructions.map((s, i) => `${i + 1}. ${s}`).join("\n");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 900,
        temperature: 0.15,
        messages: [
          {
            role: "system",
            content: "Você é um tradutor especializado em fitness e musculação. Traduza instruções de exercício do inglês para o português brasileiro. Mantenha a numeração. Use terminologia técnica de academia (barra, haltere, polia, rosca, supino). Responda SOMENTE com as instruções numeradas traduzidas.",
          },
          { role: "user", content: numbered },
        ],
      }),
    });

    if (!res.ok) return NextResponse.json({ translated: instructions });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const translated = raw
      .split(/\n/)
      .filter(l => /^\d+\./.test(l.trim()))
      .map(l => l.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

    return NextResponse.json({
      translated: translated.length >= instructions.length ? translated : instructions
    });
  } catch {
    return NextResponse.json({ translated: [] }, { status: 500 });
  }
}
