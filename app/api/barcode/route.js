import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { success: false, error: "Código de barras não fornecido." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const res = await fetch(
      `https://br.openfoodfacts.org/api/v0/product/${code}.json`,
      {
        headers: {
          "User-Agent": "HeavyDutyOS/1.0 (wanderson7.dev@gmail.com)",
        },
      }
    );

    if (!res.ok) {
      throw new Error("Erro ao consultar base Open Food Facts");
    }

    const data = await res.json();

    let food = null;
    let foundButEmpty = false;
    let productName = "";

    if (data.status === 1) {
      const p = data.product;
      const n = p.nutriments || {};
      productName = p.product_name || p.generic_name || "";

      let kcal = 0;
      if (n["energy-kcal_100g"]) {
        kcal = Math.round(n["energy-kcal_100g"]);
      } else if (n["energy_100g"]) {
        kcal = Math.round(n["energy_100g"] / 4.184);
      }

      const protein = Math.round((n.proteins_100g || 0) * 10) / 10;
      const carbs = Math.round((n.carbohydrates_100g || 0) * 10) / 10;
      const fat = Math.round((n.fat_100g || 0) * 10) / 10;

      // Check if product is missing essential nutrients
      if (kcal === 0 && protein === 0 && carbs === 0 && fat === 0) {
        foundButEmpty = true;
      } else {
        food = {
          id: `scan_${code}`,
          name: productName || "Produto Escaneado",
          kcal,
          protein,
          carbs,
          fat,
          unit: "100g",
          scanned: true,
        };
      }
    }

    // Fallback: If not found or found with all-zero macros, and we have Claude API Key, use AI fallback search
    if ((!food || foundButEmpty) && apiKey) {
      console.log(`Barcode ${code} has no macros in OFF. Using AI Search Fallback...`);
      try {
        const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 300,
            messages: [
              {
                role: "user",
                content: `Você é um especialista em nutrição e alimentos. 
O usuário buscou o código de barras "${code}" que ${
                  foundButEmpty
                    ? `retornou o produto "${productName}" mas está com os valores nutricionais zerados`
                    : "não foi encontrado"
                } na base do Open Food Facts.
Com base no seu vasto conhecimento, identifique qual é o produto correspondente a esse código de barras (ou nome "${productName}") comercializado no Brasil e retorne os valores nutricionais (calorias, proteínas, carboidratos e gorduras) por 100g.
Se não souber o produto exato pelo código, estime os valores com base em um alimento genérico idêntico ao nome "${productName}" (ou responda com uma estimativa razoável caso saiba o produto pelo código).
Responda APENAS com um JSON válido, sem texto adicional, sem explicações, sem markdown:
{"name":"Nome do Produto Correto","kcal":0,"protein":0,"carbs":0,"fat":0}
Use valores numéricos por 100g.`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const text = aiData.content?.find((b) => b.type === "text")?.text || "";
          const cleanText = text
            .trim()
            .replace(/^```json?/, "")
            .replace(/```$/, "")
            .trim();

          const parsed = JSON.parse(cleanText);

          if (parsed && (parsed.kcal || parsed.protein || parsed.carbs || parsed.fat)) {
            food = {
              id: `scan_ai_${code}`,
              name: parsed.name || productName || "Produto Lido por IA",
              kcal: Math.round(parsed.kcal || 0),
              protein: Math.round((parsed.protein || 0) * 10) / 10,
              carbs: Math.round((parsed.carbs || 0) * 10) / 10,
              fat: Math.round((parsed.fat || 0) * 10) / 10,
              unit: "100g",
              scanned: true,
              aiGenerated: true,
            };
          }
        }
      } catch (aiError) {
        console.error("AI Fallback failed:", aiError);
      }
    }

    if (food) {
      return NextResponse.json({ success: true, food });
    } else {
      const errorMsg = foundButEmpty
        ? `Produto "${productName}" encontrado na base, mas está sem os valores de macros cadastrados.`
        : "Produto não encontrado na base de dados.";

      return NextResponse.json(
        {
          success: false,
          error: apiKey
            ? `${errorMsg} (Tentativa de busca por IA também falhou)`
            : `${errorMsg} Adicione sua chave ANTHROPIC_API_KEY no arquivo .env.local para ativar a busca inteligente com IA!`,
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Open Food Facts fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Falha de conexão com a base de dados." },
      { status: 500 }
    );
  }
}

