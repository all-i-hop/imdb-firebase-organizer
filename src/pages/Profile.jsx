import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseConfig";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function Profile() {
  const [user] = useAuthState(auth);
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json)) throw new Error("Not a valid watchlist format");

      setPreview(json);
      setToast({ message: `📄 ${json.length} movies ready to import`, type: "info" });
    } catch (err) {
      setToast({ message: `❌ Error loading file: ${err.message}`, type: "error" });
    }
  };

  const handleImportConfirm = async () => {
    if (!user?.uid || !preview) return;

    try {
      const ref = doc(db, "watchlists", user.uid);
      await setDoc(ref, { items: preview }, { merge: true });
      setPreview(null);
      setToast({ message: "✅ Imported to Firestore", type: "success" });
    } catch (err) {
      setToast({ message: `❌ Firestore error: ${err.message}`, type: "error" });
    }
  };

  const migrateRatingsWithGPT = async (uid) => {
    const ref = doc(db, "watchlists", uid);
    const docSnap = await getDoc(ref);

    if (!docSnap.exists()) {
      alert("⚠️ No watchlist found.");
      return;
    }

    const data = docSnap.data();
    const items = data.items || [];

    const unenriched = items.filter(
      (m) => !m.imdbDisplay || !m.rtRating || !m.metacriticRating
    );

    const chunks = [];
    for (let i = 0; i < unenriched.length; i += 10) {
      chunks.push(unenriched.slice(i, i + 10));
    }

    const enrichedMap = {};

    for (const chunk of chunks) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a JSON assistant that enriches movie data. Return only a JSON array with imdbID, imdbRating (0-10), rtRating (0-100%), metacriticRating (0-100) for each input."
            },
            {
              role: "user",
              content: `Here are some movies to enrich:
${JSON.stringify(chunk.map(m => ({
                title: m.title,
                year: m.year,
                imdbID: m.imdbID || m.imdbId
              })))}`
            }
          ],
          temperature: 0.3,
        }),
      });

      const result = await response.json();
      const raw = result.choices?.[0]?.message?.content || "";
      const clean = raw.replace(/```json|```/g, "").trim();

      try {
        const parsed = JSON.parse(clean);
        for (const entry of parsed) {
          enrichedMap[entry.imdbID] = entry;
        }
      } catch (err) {
        console.error("GPT parsing failed:", raw);
        alert("❌ GPT enrichment failed. Check console.");
        return;
      }
    }

    const updated = items.map((movie) => {
      const enriched = enrichedMap[movie.imdbID || movie.imdbId];
      return enriched
        ? {
            ...movie,
            imdbDisplay: movie.imdbDisplay || enriched.imdbRating,
            rtRating: movie.rtRating || enriched.rtRating,
            metacriticRating: movie.metacriticRating || enriched.metacriticRating,
          }
        : movie;
    });

    await setDoc(ref, { items: updated }, { merge: true });
    alert("✅ Watchlist enriched via GPT!");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">👤 Profile</h1>
      {user ? (
        <>
          <p className="mb-2">Signed in as <strong>{user.email}</strong></p>
          <div className="my-4 space-y-2">
            <input type="file" accept=".json" onChange={handleFileUpload} />
            {preview && (
              <button
                onClick={handleImportConfirm}
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
              >
                ✅ Confirm Import ({preview.length} titles)
              </button>
            )}
            {toast && (
              <p className={`text-sm ${toast.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => migrateRatingsWithGPT(user.uid)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Migrate or Initialize Watchlist (GPT-Ratings)
          </button>
        </>
      ) : (
        <p>Please log in to manage your profile.</p>
      )}
    </div>
  );
}