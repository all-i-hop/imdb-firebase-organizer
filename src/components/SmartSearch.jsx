import { useState } from "react";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function SmartSearch({ watchlist, setFilteredList }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSmartSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const systemPrompt = `
You are a movie recommendation assistant.
You are given a list of movies in JSON format (with fields like title, genres, seen, imdbID).
Your job is to return a filtered subset based on the user's natural language query.
Return ONLY a valid JSON array of imdbIDs. Do NOT include any text, explanation, or formatting like Markdown.
`.trim();

      const userPrompt = `
Here is the watchlist: ${JSON.stringify(watchlist.slice(0, 50))}

Query: "${query}"

Return JSON array like: ["tt1234567", "tt2345678"]
`.trim();

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
        }),
      });

      const data = await res.json();
      const message = data.choices?.[0]?.message?.content;

      let parsed = [];
      try {
        const clean = message.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        console.warn("Failed to parse GPT response:", message);
        setError("Could not parse GPT response.");
        return;
      }

      const matched = watchlist.filter((movie) =>
        parsed.includes(movie.imdbID || movie.imdbId)
      );

      setFilteredList(matched);
    } catch (err) {
      console.error("Smart search error:", err);
      setError("Something went wrong during smart search.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border p-4 rounded shadow mb-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">🔍 Smart Search</h2>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder='Try "a good time movie I haven’t seen"'
          className="flex-1 border px-2 py-1 rounded"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleSmartSearch}
          className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
        >
          Search
        </button>
      </div>
      {loading && <p className="text-sm text-gray-500">GPT is thinking...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}