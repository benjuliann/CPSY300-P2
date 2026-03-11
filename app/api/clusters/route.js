import loadCSV from "../../../lib/loadCSV";

function assignCluster(recipe) {
  const protein = recipe["Protein(g)"];
  const carbs = recipe["Carbs(g)"];
  const fat = recipe["Fat(g)"];

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
      ? data.filter(row => row.Diet_type?.toLowerCase() === diet.toLowerCase())
      : data;

    const sliced = filtered.slice(0, limit);

    const clusters = sliced.map(row => {
      const recipeData = {
        ...row,
        "Protein(g)": parseFloat(row["Protein(g)"]) || 0,
        "Carbs(g)": parseFloat(row["Carbs(g)"]) || 0,
        "Fat(g)": parseFloat(row["Fat(g)"]) || 0
      };

      return {
        diet: recipeData.Diet_type.toLowerCase(),
        recipe: recipeData.Recipe_name,
        protein: recipeData["Protein(g)"],
        carbs: recipeData["Carbs(g)"],
        fat: recipeData["Fat(g)"],
        cluster: assignCluster(recipeData)
      };
    });

    return new Response(JSON.stringify(clusters), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Error loading recipes:", err);
    return new Response(JSON.stringify({ error: "Failed to load recipes" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}