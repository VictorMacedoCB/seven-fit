import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ success: true, foods: [] });
  }

  try {
    const res = await fetch(
      `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        query
      )}&search_simple=1&action=process&json=1&page_size=15&cc=br&lc=pt`,
      {
        headers: {
          "User-Agent": "HeavyDutyOS/1.0 (wanderson7.dev@gmail.com)",
        },
      }
    );

    if (!res.ok) {
      throw new Error("Erro ao consultar Open Food Facts search");
    }

    const data = await res.json();
    const products = data.products || [];

    const foods = products
      .filter((p) => p.product_name || p.generic_name)
      .map((p) => {
        const n = p.nutriments || {};
        let kcal = 0;
        if (n["energy-kcal_100g"]) {
          kcal = Math.round(n["energy-kcal_100g"]);
        } else if (n["energy_100g"]) {
          kcal = Math.round(n["energy_100g"] / 4.184);
        }

        const brandStr = p.brands ? ` [${p.brands.split(",")[0]}]` : "";
        const fullName = `${p.product_name || p.generic_name}${brandStr}`;

        return {
          id: p.code || `search_${Math.random()}`,
          name: fullName,
          kcal,
          protein: Math.round((n.proteins_100g || 0) * 10) / 10,
          carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
          fat: Math.round((n.fat_100g || 0) * 10) / 10,
          unit: "100g",
          brand: p.brands || "",
        };
      })
      // Filter out items that have completely zero nutrients to avoid polluted empty search results
      .filter((f) => f.kcal > 0 || f.protein > 0 || f.carbs > 0 || f.fat > 0);

    return NextResponse.json({ success: true, foods });
  } catch (error) {
    console.error("Open Food Facts search error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar alimentos online." },
      { status: 500 }
    );
  }
}
