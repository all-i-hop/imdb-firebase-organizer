// Full working App.jsx with all filters restored and clickable title detail routing
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { auth, googleProvider, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useUserWatchlist } from "@/lib/useUserWatchlist.jsx";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import SmartSearch from "@/components/SmartSearch";

export default function App() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [sortBy, setSortBy] = useState("rating");
  const [releaseStatus, setReleaseStatus] = useState("all");
  const [hideSeen, setHideSeen] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);
  const [smartResults, setSmartResults] = useState([]);
  const [showGenres, setShowGenres] = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [titlesPerPage, setTitlesPerPage] = useState(20); // default to 20
  const [selectedDecade, setSelectedDecade] = useState(null); // Decade filter


  const genresRef = useRef();
  const typesRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (genresRef.current && !genresRef.current.contains(e.target)) setShowGenres(false);
      if (typesRef.current && !typesRef.current.contains(e.target)) setShowTypes(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const { watchlist, setWatchlist, loading } = useUserWatchlist(user?.uid);

  const toggleSeen = async (movie) => {
    if (!user?.uid) return;
    const ref = doc(db, "watchlists", user.uid);
    const docSnap = await getDoc(ref);
    if (!docSnap.exists()) return;
    const updatedItems = docSnap.data().items.map((m) =>
      m.title === movie.title ? { ...m, seen: !m.seen } : m
    );
    await updateDoc(ref, { items: updatedItems });
    setWatchlist(updatedItems);
  };

  const sortMovies = (a, b) => {
    switch (sortBy) {
      case "rating": return (b.imdbRating || 0) - (a.imdbRating || 0);
      case "runtime": return (b.runtimeMinutes || 0) - (a.runtimeMinutes || 0);
      case "title": return a.title.localeCompare(b.title);
      case "recent": return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
      default: return 0;
    }
  };

  const isReleased = (movie) => new Date(movie.releaseDate) <= new Date();
  const isRecent = (d) => d && (new Date() - new Date(d)) / 86400000 <= 30;

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedTypes([]);
    setSearch("");
    setReleaseStatus("all");
    setHideSeen(false);
    setRecentOnly(false);
  };

  const removeMovie = async (movie) => {
    if (!user?.uid) return;
    const ref = doc(db, "watchlists", user.uid);
    const docSnap = await getDoc(ref);
    if (!docSnap.exists()) return;
    
    const data = docSnap.data();
    const updatedItems = data.items.filter((m) => m.title !== movie.title);
  
    await updateDoc(ref, { items: updatedItems });
    setWatchlist(updatedItems);
  };
  

  const filtered = (watchlist || []).filter((movie) =>
    (movie.title || "").toLowerCase().includes(search.toLowerCase()) &&
    (selectedGenres.length === 0 || selectedGenres.some(g => (movie.genres || "").includes(g))) &&
    (selectedTypes.length === 0 || selectedTypes.includes(movie.type)) &&
    (selectedDecade === null || (movie.year && Math.floor(parseInt(movie.year, 10) / 10) * 10 === selectedDecade)) &&
    (minRating === 0 || parseFloat(movie.imdbDisplay || 0) >= minRating) &&
    (releaseStatus === "released" ? isReleased(movie) : releaseStatus === "unreleased" ? !isReleased(movie) : true) &&
    (!hideSeen || !movie.seen) &&
    (!recentOnly || isRecent(movie.addedAt))
  ).sort(sortMovies);


  const uniqueGenres = Array.from(new Set((watchlist || []).flatMap(m => (m.genres || "").split(", ")))).sort();
  const uniqueTypes = Array.from(new Set((watchlist || []).map(m => m.type).filter(Boolean))).sort();

  const displayList = smartResults.length ? smartResults : filtered;

  const indexOfLast = currentPage * titlesPerPage;
  const indexOfFirst = indexOfLast - titlesPerPage;
  const currentTitles = displayList.slice(indexOfFirst, indexOfLast);

  const availableDecades = Array.from(
    new Set(
      (watchlist || []).map((movie) => {
        if (!movie.year) return null;
        const yearNum = parseInt(movie.year, 10);
        if (isNaN(yearNum)) return null;
        return Math.floor(yearNum / 10) * 10;
      }).filter(Boolean)
    )
  ).sort((a, b) => a - b);

  
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#121212] px-4 py-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end items-center mb-4">
          {user ? (
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-700">Hi, {user.displayName}</span>
              <Link to="/add" className="text-sm text-green-600 border px-2 py-1 rounded hover:bg-green-100">➕ Add Movie</Link>
              <button onClick={() => signOut(auth)} className="text-sm text-red-600 border px-2 py-1 rounded hover:bg-red-100">Logout</button>
            </div>
          ) : (
            <button onClick={() => signInWithPopup(auth, googleProvider)} className="text-sm text-blue-600 border px-2 py-1 rounded hover:bg-blue-100">Login with Google</button>
          )}
        </div>

        {!user ? <p className="text-center text-gray-500 mt-10">Please sign in to view your watchlist.</p> : loading ? <p className="text-center mt-10 text-gray-500">Loading watchlist...</p> : (
          <>
            {user && !loading && watchlist.length > 0 && (
              <SmartSearch watchlist={watchlist} setFilteredList={setSmartResults} />
            )}
            <h1 className="text-3xl font-bold mb-6 text-center">IMDb Watchlist</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 mb-8">
              <Input placeholder="Search movies..." value={search} onChange={(e) => setSearch(e.target.value)} />

              <div className="relative" ref={genresRef}>
                <button onClick={() => setShowGenres(!showGenres)} className="border rounded px-4 py-2 bg-white text-sm shadow-sm">
                  Genres {selectedGenres.length > 0 ? `(${selectedGenres.length})` : ""}
                </button>
                {showGenres && (
                  <div className="absolute mt-2 w-64 bg-white border rounded shadow-md z-50 max-h-60 overflow-auto p-3 grid grid-cols-2 gap-2 text-sm">
                    {uniqueGenres.map((g) => (
                      <label key={g} className="flex items-center gap-1 whitespace-nowrap">
                        <input type="checkbox" checked={selectedGenres.includes(g)} onChange={(e) => setSelectedGenres((prev) => e.target.checked ? [...prev, g] : prev.filter(x => x !== g))} />
                        {g}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={typesRef}>
                <button onClick={() => setShowTypes(!showTypes)} className="border rounded px-4 py-2 bg-white text-sm shadow-sm">
                  Types {selectedTypes.length > 0 ? `(${selectedTypes.length})` : ""}
                </button>
                {showTypes && (
                  <div className="absolute mt-2 w-48 bg-white border rounded shadow-md z-50 max-h-60 overflow-auto p-3 grid grid-cols-1 gap-2 text-sm">
                    {uniqueTypes.map((type) => (
                      <label key={type} className="flex items-center gap-1 whitespace-nowrap">
                        <input type="checkbox" checked={selectedTypes.includes(type)} onChange={(e) => setSelectedTypes((prev) => e.target.checked ? [...prev, type] : prev.filter(t => t !== type))} />
                        {type}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={selectedDecade || ""}
                onChange={(e) => setSelectedDecade(e.target.value ? Number(e.target.value) : null)}
                className="border rounded p-2 bg-white text-sm"
              >
                <option value="">All Decades</option>
                {availableDecades.map((decade) => (
                  <option key={decade} value={decade}>
                    {decade}s
                  </option>
                ))}
              </select>

              <select
                value={titlesPerPage}
                onChange={(e) => {
                  setTitlesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded p-2 bg-white text-sm"
              >
                <option value={10}>10 titles per page</option>
                <option value={20}>20 titles per page</option>
                <option value={50}>50 titles per page</option>
              </select>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="border rounded p-2 bg-white"
              >
                <option value={0}>All Ratings</option>
                <option value={5}>5.0+ IMDb</option>
                <option value={6}>6.0+ IMDb</option>
                <option value={7}>7.0+ IMDb</option>
                <option value={8}>8.0+ IMDb</option>
              </select>

              <select className="border rounded p-2 bg-white" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="rating">Sort by Rating</option>
                <option value="runtime">Sort by Runtime</option>
                <option value="title">Sort by Title</option>
                <option value="recent">Sort by Recently Added</option>
              </select>

              <select className="border rounded p-2 bg-white" value={releaseStatus} onChange={(e) => setReleaseStatus(e.target.value)}>
                <option value="all">All Releases</option>
                <option value="released">Released Only</option>
                <option value="unreleased">Unreleased Only</option>
              </select>

              <div className="flex flex-col gap-1 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hideSeen} onChange={() => setHideSeen(!hideSeen)} /> Hide Seen
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={recentOnly} onChange={() => setRecentOnly(!recentOnly)} /> Recently Added (30d)
                </label>
              </div>
            </div>

            <div className="mb-6">
              <button onClick={clearFilters} className="text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-100">
                Clear Filters
              </button>
            </div>

            {filtered.length === 0 ? <p className="text-center text-gray-500 mt-10">No movies found.</p> : (
              <div className="space-y-6">
                <div className="text-center text-sm text-gray-600 mb-6">
                  {filtered.length} / {watchlist.length} titles showing
                </div>
                {currentTitles.map((movie, idx) => (
                  <Card key={idx} className="flex bg-white rounded-sm border shadow p-4 gap-4">
                    <img src={movie.poster} alt={movie.title} className="w-[48px] h-[72px] object-cover" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-[16px] font-bold leading-tight">
        <a
          href={`https://www.imdb.com/title/${movie.imdbID || movie.imdbId}`}
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
      {movie.type && (
        <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-full">
          {movie.type}
        </span>
      )}
    </div>

    <button
      onClick={() => {
        if (confirm(`Are you sure you want to remove "${movie.title}"?`)) {
          removeMovie(movie);
        }
      }}
      className="text-red-500 text-xs hover:underline"
    >
      ❌ Remove
    </button>
  </div>

                      <div className="flex gap-2 text-sm mb-1 items-center flex-wrap">
                        {movie.imdbDisplay && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-semibold">IMDb: {movie.imdbDisplay}</span>}
                        {movie.rtRating && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">🍅 RT: {movie.rtRating}</span>}
                        {movie.metacriticRating && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">MC: {movie.metacriticRating}</span>}
                        {movie.genres && <span className="text-gray-600 text-xs">{movie.genres}</span>}
                      </div>
                      {movie.plot && <p className="text-sm text-gray-700 mb-2">{movie.plot}</p>}
                      <label className="inline-flex items-center gap-2 mt-2 text-sm">
                        <input type="checkbox" checked={movie.seen || false} onChange={() => toggleSeen(movie)} />
                        Mark as Seen
                      </label>
                    </div>
                  </Card>
                ))}
                <div className="flex justify-center items-center gap-2 mt-8">
  <button
    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    className="px-3 py-1 border rounded disabled:opacity-50"
  >
    Prev
  </button>

  <span className="text-sm">
    Page {currentPage} of {Math.ceil(displayList.length / titlesPerPage)}
  </span>

  <button
    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(displayList.length / titlesPerPage)))}
    disabled={currentPage === Math.ceil(displayList.length / titlesPerPage)}
    className="px-3 py-1 border rounded disabled:opacity-50"
  >
    Next
  </button>
</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
