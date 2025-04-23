import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseConfig";
import { setDoc } from "firebase/firestore";


const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY;

export default function SearchToAdd() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user] = useAuthState(auth);

  const searchOMDb = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.Search || []);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (imdbID) => {
    if (!user) return;

    const detailsRes = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbID}`);
    const movie = await detailsRes.json();

    const rtRating = movie.Ratings?.find(r => r.Source === "Rotten Tomatoes")?.Value || null;
    const imdbRating = movie.Ratings?.find(r => r.Source === "Internet Movie Database")?.Value || null;
    const metacriticRating = movie.Ratings?.find(r => r.Source === "Metacritic")?.Value || null;

    const ref = doc(db, "watchlists", user.uid);
    const docSnap = await getDoc(ref);
    const current = docSnap.exists() ? docSnap.data().items || [] : [];

    const alreadyExists = current.some((m) => m.imdbID === movie.imdbID);
    if (alreadyExists) return alert("Already in your watchlist.");

    const item = {
      title: movie.Title,
      year: movie.Year,
      genres: movie.Genre,
      imdbRating: parseFloat(movie.imdbRating),
      imdbDisplay: imdbRating,
      rtRating: rtRating,
      metacriticRating: metacriticRating,
      runtimeMinutes: parseInt(movie.Runtime),
      cast: movie.Actors,
      link: `https://www.imdb.com/title/${movie.imdbID}/`,
      poster: movie.Poster,
      plot: movie.Plot,
      type: movie.Type,
      imdbID: movie.imdbID,
      voteCount: parseInt(movie.imdbVotes.replace(/,/g, "")) || 0,
      seen: false,
    };

    await setDoc(ref, {
      items: [...current, item]
    }, { merge: true});

    alert("Added to your watchlist!");
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Search & Add Movie</h2>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border px-2 py-1 rounded"
          placeholder="Enter movie title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={searchOMDb} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
          Search
        </button>
      </div>
      {loading && <p>Loading...</p>}
      <ul className="space-y-4">
        {results.map((movie) => (
          <li key={movie.imdbID} className="flex items-center gap-4 border p-2 rounded bg-white">
            <img src={movie.Poster} alt={movie.Title} className="w-12 h-18 object-cover" />
            <div className="flex-1">
              <p className="font-semibold">{movie.Title} ({movie.Year})</p>
              <p className="text-sm text-gray-500 capitalize">{movie.Type}</p>
            </div>
            <button
              onClick={() => addToWatchlist(movie.imdbID)}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}