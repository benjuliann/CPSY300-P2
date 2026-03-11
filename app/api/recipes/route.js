import loadCSV from "@/lib/loadCSV";

function assignCluster(recipe) {
  const protein = parseFloat(recipe["Protein(g)"]) || 0;
  const carbs = parseFloat(recipe["Carbs(g)"]) || 0;
  const fat = parseFloat(recipe["Fat(g)"]) || 0;

  if (protein > 150 || fat > 140) return 1;
  if (protein > 50 && carbs < 200) return 2;
  return 3;
}

export async function GET(request) {
  try {
    const data = await loadCSV();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 200;
    const diet = searchParams.get("diet");

    let filtered = diet && diet.toLowerCase() !== "all"
      ? data.filter(r => r["Diet_type"]?.toLowerCase() === diet.toLowerCase())
      : data;

    const sliced = filtered.slice(0, limit);

    const clusters = sliced.map(row => ({
      diet: row.Diet_type.toLowerCase(),
      recipe: row.Recipe_name,
      protein: parseFloat(row["Protein(g)"]) || 0,
      carbs: parseFloat(row["Carbs(g)"]) || 0,
      fat: parseFloat(row["Fat(g)"]) || 0,
      cluster: assignCluster(row)
    }));

    return new Response(JSON.stringify(clusters), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: "Failed to load recipes" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}