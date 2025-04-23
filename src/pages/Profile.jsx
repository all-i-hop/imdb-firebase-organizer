import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseConfig";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY;

export default function Profile() {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);

  const migrateRatings = async (uid) => {
    const ref = doc(db, "watchlists", uid);
    const docSnap = await getDoc(ref);

    let items = [];

    if (docSnap.exists()) {
      const data = docSnap.data();
      items = data.items || [];
    } else {
      // Fallback: load sample JSON from public
      try {
        const res = await fetch("/watchlist_flat-sample.json");
        const json = await res.json();
        items = json;
      } catch (e) {
        console.error("❌ Failed to load fallback JSON", e);
        alert("Failed to migrate — no watchlist found.");
        return;
      }
    }

    const updated = [];

    for (const movie of items) {
      if (movie.rtRating && movie.imdbDisplay && movie.metacriticRating) {
        updated.push(movie);
        continue;
      }

      try {
        const imdbID = movie.imdbID || movie.imdbId;
        if (!imdbID) continue;

        const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbID}`);
        const full = await res.json();

        const imdbDisplay = full.Ratings?.find(r => r.Source === "Internet Movie Database")?.Value || null;
        const rtRating = full.Ratings?.find(r => r.Source === "Rotten Tomatoes")?.Value || null;
        const metacriticRating = full.Ratings?.find(r => r.Source === "Metacritic")?.Value || null;

        updated.push({
          ...movie,
          imdbDisplay: movie.imdbDisplay || imdbDisplay,
          rtRating: movie.rtRating || rtRating,
          metacriticRating: movie.metacriticRating || metacriticRating,
        });
      } catch (err) {
        console.warn("Failed to update:", movie.title, err);
        updated.push(movie); // fallback to original
      }
    }

    await setDoc(ref, { items: updated }, { merge: true });
    alert("✅ Migration complete! Ratings updated.");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">👤 Profile</h1>
      {user ? (
        <>
          <p className="mb-2">Signed in as <strong>{user.email}</strong></p>
          <button
            onClick={() => migrateRatings(user.uid)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Migrate or Initialize Watchlist (with Ratings)
          </button>
        </>
      ) : (
        <p>Please log in to manage your profile.</p>
      )}
    </div>
  );
}