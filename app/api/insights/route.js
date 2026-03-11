import loadCSV from "@/lib/loadCSV";

export async function GET() {
  try {
    const data = await loadCSV();

    const grouped = {};
    data.forEach(row => {
      const diet = row["Diet_type"];
      if (!grouped[diet]) grouped[diet] = { protein: 0, carbs: 0, fat: 0, count: 0 };

      grouped[diet].protein += parseFloat(row["Protein(g)"]) || 0;
      grouped[diet].carbs += parseFloat(row["Carbs(g)"]) || 0;
      grouped[diet].fat += parseFloat(row["Fat(g)"]) || 0;
      grouped[diet].count++;
    });

    const result = Object.keys(grouped).map(diet => ({
      diet: diet.toLowerCase(),
      protein: grouped[diet].protein / grouped[diet].count,
      carbs: grouped[diet].carbs / grouped[diet].count,
      fat: grouped[diet].fat / grouped[diet].count
    }));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Insights error:", err);
    return new Response(JSON.stringify({ error: "Failed to calculate insights" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}