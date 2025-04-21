import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { auth, googleProvider } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useUserWatchlist } from "@/lib/useUserWatchlist";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";


export default function App() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [releaseStatus, setReleaseStatus] = useState("all");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const { watchlist, setWatchlist, loading } = useUserWatchlist(user?.uid);

  const sortMovies = (a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.imdbRating || 0) - (a.imdbRating || 0);
      case "runtime":
        return (b.runtimeMinutes || 0) - (a.runtimeMinutes || 0);
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  };

  const isReleased = (movie) => {
    if (!movie.releaseDate) return false;
    const release = new Date(movie.releaseDate);
    return !isNaN(release) && release <= new Date();
  };

  const filtered = (watchlist || [])
    .filter((movie) =>
      (movie.title || "").toLowerCase().includes(search.toLowerCase()) &&
      (genreFilter ? (movie.genres || "").includes(genreFilter) : true) &&
      (typeFilter ? movie.type === typeFilter : true) &&
      (releaseStatus === "released"
        ? isReleased(movie)
        : releaseStatus === "unreleased"
        ? !isReleased(movie)
        : true)
    )
    .sort(sortMovies);

  const uniqueGenres = Array.from(
    new Set((watchlist || []).flatMap((m) => (m.genres || "").split(", ")))
  ).sort();

  const uniqueTypes = Array.from(
    new Set((watchlist || []).map((m) => m.type).filter(Boolean))
  ).sort();

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#121212] px-4 py-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end items-center mb-4">
          {user ? (
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-700">Hi, {user.displayName}</span>
              <button
                onClick={() => signOut(auth)}
                className="text-sm text-red-600 border px-2 py-1 rounded hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="text-sm text-blue-600 border px-2 py-1 rounded hover:bg-blue-100"
            >
              Login with Google
            </button>
          )}
        </div>

        {!user ? (
          <p className="text-center text-gray-500 mt-10">
            Please sign in to view your watchlist.
          </p>
        ) : loading ? (
          <p className="text-center mt-10 text-gray-500">Loading watchlist...</p>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6 text-center">IMDb Watchlist</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
              <Input
                placeholder="Search movies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="border border-gray-300 rounded p-2 bg-white"
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
              >
                <option value="">All Genres</option>
                {uniqueGenres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <select
                className="border border-gray-300 rounded p-2 bg-white"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                className="border border-gray-300 rounded p-2 bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Sort by Rating</option>
                <option value="runtime">Sort by Runtime</option>
                <option value="title">Sort by Title</option>
              </select>
              <select
                className="border border-gray-300 rounded p-2 bg-white"
                value={releaseStatus}
                onChange={(e) => setReleaseStatus(e.target.value)}
              >
                <option value="all">All Releases</option>
                <option value="released">Released Only</option>
                <option value="unreleased">Unreleased Only</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">No movies found.</p>
            ) : (
              <div className="space-y-6">
                {filtered.map((movie, idx) => (
                  <Card key={idx} className="flex bg-white rounded-sm border border-gray-300 shadow p-4 gap-4">
                    <img
                      src={movie.poster}
                      alt={`${movie.title} poster`}
                      className="w-[48px] h-[72px] object-cover"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-[16px] font-bold leading-tight">
                          <a
                            href={movie.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-[#121212]"
                          >
                            {idx + 1}. {movie.title}
                          </a>
                        </h2>
                        {movie.year && <span className="text-xs text-gray-600">{movie.year}</span>}
                        {movie.runtimeMinutes && (
                          <span className="text-xs text-gray-600">
                            • {Math.floor(movie.runtimeMinutes / 60)}h {movie.runtimeMinutes % 60}m
                          </span>
                        )}
                        {movie.rating && <span className="text-xs text-gray-600">• {movie.rating}</span>}
                      </div>
                      {movie.plot && <p className="text-sm text-gray-700 mb-1">{movie.plot}</p>}
                      <div className="flex flex-wrap gap-4 text-sm mb-1 items-center">
                        {movie.imdbRating && (
                          <span className="text-yellow-600 font-semibold">
                            ⭐ {movie.imdbRating}
                            {movie.voteCount && (
                              <span className="text-gray-500 font-normal"> ({movie.voteCount.toLocaleString()})</span>
                            )}
                          </span>
                        )}
                        {movie.genres && <span className="text-gray-600">{movie.genres}</span>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
