"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
  ScatterChart, Scatter,
  PieChart, Pie, Cell,
} from "recharts";

// ── Constants ─────────────────────────────────────────────────────────────
const DIET_TYPES = ["All Diet Types", "Vegan", "Keto", "Paleo", "Mediterranean", "Dash"];
const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
const CLUSTER_COLORS = { 1: "#EF4444", 2: "#F59E0B", 3: "#2563EB" };
const CLUSTER_LABELS = { 1: "High Protein/Fat", 2: "Medium Protein", 3: "Low Protein/High Carb" };
const ITEMS_PER_PAGE = 10;

const CHART_CARDS = [
  { id: "bar",     title: "Bar Chart",    description: "Average macronutrient content by diet type." },
  { id: "scatter", title: "Scatter Plot", description: "Nutrient relationships (e.g., protein vs carbs)." },
  { id: "heatmap", title: "Heatmap",      description: "Nutrient correlations." },
  { id: "pie",     title: "Pie Chart",    description: "Recipe distribution by diet type." },
];

const CHART_TITLES = {
  bar:     "Bar Chart — Avg Macronutrients by Diet",
  scatter: "Scatter Plot — Protein vs Carbs (Clusters)",
  heatmap: "Heatmap — Nutrient Correlations",
  pie:     "Pie Chart — Recipe Distribution",
};

// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-7 h-7 rounded-full border-[3px] border-slate-200 border-t-blue-600 animate-spin" />
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────
function BarPanel({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="diet" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={v => v.toFixed(1) + "g"} />
        <Legend />
        <Bar dataKey="protein" name="Protein (g)" fill="#2563EB" radius={[4, 4, 0, 0]} />
        <Bar dataKey="carbs"   name="Carbs (g)"   fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="fat"     name="Fat (g)"     fill="#F59E0B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ScatterPanel({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="protein"
          type="number"
          name="Protein (g)"
          tick={{ fontSize: 11 }}
          label={{ value: "Protein (g)", position: "insideBottom", offset: -14, fontSize: 11 }}
        />
        <YAxis
          dataKey="carbs"
          type="number"
          name="Carbs (g)"
          tick={{ fontSize: 11 }}
          label={{ value: "Carbs (g)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs max-w-[220px] shadow-sm">
                <p className="font-bold text-slate-800">{d.recipe?.slice(0, 35)}</p>
                <p className="text-slate-500 mt-1">Protein: {d.protein}g · Carbs: {d.carbs}g</p>
                <p className="font-semibold mt-1" style={{ color: CLUSTER_COLORS[d.cluster] }}>
                  {CLUSTER_LABELS[d.cluster]}
                </p>
              </div>
            );
          }}
        />
        {[1, 2, 3].map(c => (
          <Scatter
            key={c}
            name={CLUSTER_LABELS[c]}
            data={data.filter(d => d.cluster === c)}
            fill={CLUSTER_COLORS[c]}
            opacity={0.7}
          />
        ))}
        <Legend verticalAlign="bottom" height={36} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function HeatmapPanel({ data }) {
  const nutrients = ["protein", "carbs", "fat"];
  const allVals = data.flatMap(d => nutrients.map(n => d[n]));
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const norm = v => (v - min) / (max - min);
  const cellColor = t => {
    const r = Math.round(37 + (219 - 37) * (1 - t));
    const g = Math.round(99 + (234 - 99) * (1 - t));
    const b = Math.round(235 + (254 - 235) * (1 - t));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div className="overflow-x-auto py-2">
      <table className="mx-auto text-sm border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="px-4 py-1.5 text-left text-slate-500 font-semibold">Diet</th>
            {nutrients.map(n => (
              <th key={n} className="px-6 py-1.5 text-slate-500 font-semibold capitalize">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.diet}>
              <td className="px-4 py-2 font-semibold text-slate-800 capitalize">{row.diet}</td>
              {nutrients.map(n => {
                const t = norm(row[n]);
                return (
                  <td
                    key={n}
                    className="px-6 py-3 rounded-md text-center font-medium min-w-[90px]"
                    style={{
                      backgroundColor: cellColor(t),
                      color: t > 0.55 ? "white" : "#1E293B",
                    }}
                  >
                    {row[n].toFixed(1)}g
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PiePanel({ data }) {
  const pieData = data.map(d => ({ name: d.diet, value: Math.round(d.protein + d.carbs + d.fat) }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%" cy="50%"
          outerRadius={100}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedDiet, setSelectedDiet] = useState("All Diet Types");

  const [activeChart, setActiveChart] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [clustersData, setClustersData] = useState(null);

  const [loading, setLoading] = useState(null);
  const [apiResults, setApiResults] = useState(null);
  const [allRecipes, setAllRecipes] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Client-side search filter applied on top of allRecipes
  const filteredRecipes = allRecipes
    ? allRecipes.filter(r => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          r.Recipe_name?.toLowerCase().includes(q) ||
          r.Diet_type?.toLowerCase().includes(q) ||
          r.Cuisine_type?.toLowerCase().includes(q)
        );
      })
    : null;

  const totalPages = filteredRecipes ? Math.ceil(filteredRecipes.length / ITEMS_PER_PAGE) : 1;

  // Reset to page 1 whenever search changes
  useEffect(() => { setCurrentPage(1); }, [search]);

  useEffect(() => { loadRecipes("All Diet Types"); }, []);

  useEffect(() => {
    loadRecipes(selectedDiet);
    if (activeChart) refreshChartData(activeChart, selectedDiet);
  }, [selectedDiet]);

  const dietParam = (diet) => diet !== "All Diet Types" ? diet.toLowerCase() : "all";

  const loadRecipes = async (diet) => {
    setCurrentPage(1);
    try {
      const res = await fetch(`/api/recipes?diet=${dietParam(diet)}`);
      const data = await res.json();
      setAllRecipes(data);
      setApiResults(prev =>
        prev?.endpoint === "recipes"
          ? { endpoint: "recipes", data: data.slice(0, ITEMS_PER_PAGE) }
          : prev
      );
    } catch (e) { console.error(e); }
  };

  const refreshChartData = async (chartId, diet) => {
    setChartLoading(true);
    try {
      if (chartId === "scatter") {
        const res = await fetch(`/api/clusters?limit=200&diet=${dietParam(diet)}`);
        setClustersData(await res.json());
      } else {
        const res = await fetch(`/api/insights`);
        setInsightsData(await res.json());
      }
    } catch (e) { console.error(e); }
    finally { setChartLoading(false); }
  };

  const handleChartClick = async (id) => {
    if (activeChart === id) { setActiveChart(null); return; }
    setActiveChart(id);
    const param = dietParam(selectedDiet);
    if (id === "scatter") {
      if (!clustersData) {
        setChartLoading(true);
        try {
          const res = await fetch(`/api/clusters?limit=200&diet=${param}`);
          setClustersData(await res.json());
        } catch (e) { console.error(e); }
        finally { setChartLoading(false); }
      }
    } else {
      if (!insightsData) {
        setChartLoading(true);
        try {
          const res = await fetch(`/api/insights`);
          setInsightsData(await res.json());
        } catch (e) { console.error(e); }
        finally { setChartLoading(false); }
      }
    }
  };

  const fetchData = async (endpoint) => {
    setLoading(endpoint);
    setCurrentPage(1);
    try {
      const params = new URLSearchParams();
      if (endpoint === "recipes" || endpoint === "clusters") params.append("diet", dietParam(selectedDiet));
      if (endpoint === "clusters") params.append("limit", "200");
      const res = await fetch(`/api/${endpoint}?${params.toString()}`);
      const data = await res.json();
      if (endpoint === "recipes" && Array.isArray(data)) {
        setAllRecipes(data);
        setApiResults({ endpoint, data: data.slice(0, ITEMS_PER_PAGE) });
      } else {
        setApiResults({ endpoint, data });
      }
    } catch {
      setApiResults({ endpoint, error: "Failed to fetch data." });
    } finally {
      setLoading(null);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (filteredRecipes && apiResults?.endpoint === "recipes") {
      setApiResults(prev => ({
        ...prev,
        data: filteredRecipes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
      }));
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const renderChart = () => {
    if (chartLoading) return <Spinner />;
    if (activeChart === "bar"     && insightsData) return <BarPanel data={insightsData} />;
    if (activeChart === "scatter" && clustersData) return <ScatterPanel data={clustersData} />;
    if (activeChart === "heatmap" && insightsData) return <HeatmapPanel data={insightsData} />;
    if (activeChart === "pie"     && insightsData) return <PiePanel data={insightsData} />;
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans">

      {/* Header */}
      <header className="bg-blue-600 px-8 py-4 shadow-md">
        <h1 className="text-white text-2xl font-bold tracking-tight">Nutritional Insights</h1>
      </header>

      <main className="flex-1 w-full max-w-[960px] mx-auto px-8 py-8 box-border">

        {/* Explore Section */}
        <section className="mb-9">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Explore Nutritional Insights</h2>
          <div className="grid grid-cols-4 gap-4">
            {CHART_CARDS.map(card => (
              <div
                key={card.id}
                onClick={() => handleChartClick(card.id)}
                className={`bg-white rounded-xl p-5 cursor-pointer flex flex-col gap-1.5 transition-all duration-200 hover:-translate-y-0.5 ${
                  activeChart === card.id
                    ? "ring-2 ring-blue-600 shadow-md"
                    : "shadow-sm hover:shadow-md"
                }`}
              >
                <p className="font-bold text-sm text-slate-800">{card.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          {/* Chart Panel */}
          {activeChart && (
            <div className="bg-white rounded-xl px-6 py-5 mt-4 shadow-sm">
              <p className="text-sm font-bold text-slate-800 mb-4">{CHART_TITLES[activeChart]}</p>
              {renderChart()}
            </div>
          )}
        </section>

        {/* Filters */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Filters and Data Interaction</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by Diet Type"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-md text-sm text-slate-700 bg-white outline-none w-52 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={selectedDiet}
              onChange={e => setSelectedDiet(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-md text-sm text-slate-700 bg-white cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DIET_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </section>

        {/* API Buttons */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">API Data Interaction</h2>
          <div className="flex gap-3">
            {[
              { label: "Get Nutritional Insights", endpoint: "insights", cls: "bg-blue-600 hover:bg-blue-700" },
              { label: "Get Recipes",              endpoint: "recipes",  cls: "bg-green-600 hover:bg-green-700" },
              { label: "Get Clusters",             endpoint: "clusters", cls: "bg-violet-600 hover:bg-violet-700" },
            ].map(({ label, endpoint, cls }) => (
              <button
                key={endpoint}
                onClick={() => fetchData(endpoint)}
                disabled={loading === endpoint}
                className={`px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-colors tracking-wide ${
                  loading === endpoint ? "bg-slate-400 cursor-not-allowed" : `${cls} cursor-pointer`
                }`}
              >
                {loading === endpoint ? "Loading..." : label}
              </button>
            ))}
          </div>

          {/* Results box */}
          {apiResults && (
            <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-sm text-slate-700 max-h-60 overflow-y-auto">
              <p className="font-bold mb-2 text-slate-800 capitalize">
                {apiResults.endpoint} Results:
                {filteredRecipes && apiResults.endpoint === "recipes" && (
                  <span className="font-normal text-xs text-slate-500 ml-2">
                    showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredRecipes.length)} of {filteredRecipes.length} recipes
                    {search && allRecipes && filteredRecipes.length !== allRecipes.length && (
                      <span className="ml-1 text-blue-500">(filtered from {allRecipes.length})</span>
                    )}
                  </span>
                )}
              </p>
              {apiResults.error ? (
                <p className="text-red-500">{apiResults.error}</p>
              ) : (
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(apiResults.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </section>

        {/* Pagination */}
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Pagination</h2>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium transition-colors ${
                currentPage === 1
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-700 hover:bg-slate-50 cursor-pointer"
              }`}
            >
              Previous
            </button>

            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3.5 py-2 rounded-md text-sm font-medium min-w-[36px] transition-colors cursor-pointer ${
                  currentPage === page
                    ? "bg-blue-600 text-white font-bold border-none"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-700 hover:bg-slate-50 cursor-pointer"
              }`}
            >
              Next
            </button>
          </div>

          {filteredRecipes && (
            <p className="text-center text-xs text-slate-400 mt-2">
              Page {currentPage} of {totalPages} · {filteredRecipes.length} total recipes
            </p>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-blue-600 px-8 py-4 text-center">
        <p className="text-white text-sm opacity-90">© 2026 Nutritional Insights. All Rights Reserved.</p>
      </footer>

    </div>
  );
}