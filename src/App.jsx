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

function CastWithExpand({ castString, search }) {
  const [expanded, setExpanded] = useState(false);
  const actors = (castString || "").split(", ");

  const displayedCast = expanded ? actors : actors.slice(0, 3);
  const isExpandable = actors.length > 3;

  return (
    <span className="inline-block transition-all duration-300">
      {displayedCast.map((actor, index) => (
        <a
          key={index}
          href={`https://www.imdb.com/find?q=${encodeURIComponent(actor)}&s=nm`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline mr-2"
        >
          {highlightMatch(actor, search)}
        </a>
      ))}
      {isExpandable && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setExpanded(!expanded);
          }}
          className="text-gray-500 hover:text-gray-700 text-xs underline ml-1"
        >
          {expanded ? "Show Less" : "Show More"}
        </button>
      )}
    </span>
  );
}

function highlightMatch(text, search) {
  if (!search) return text;
  const regex = new RegExp(`(${search})`, "gi");
  const parts = (text || "").split(regex);
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 text-black px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}


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
  const [selectedMovies, setSelectedMovies] = useState([]);



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

  const markSelectedAsSeen = async () => {
    if (!user?.uid) return;
    const ref = doc(db, "watchlists", user.uid);
    const docSnap = await getDoc(ref);
    if (!docSnap.exists()) return;
  
    const data = docSnap.data();
    const updatedItems = data.items.map((m) =>
      selectedMovies.includes(m.title) ? { ...m, seen: true } : m
    );
  
    await updateDoc(ref, { items: updatedItems });
    setWatchlist(updatedItems);
    setSelectedMovies([]);
  };
  
  const removeSelectedMovies = async () => {
    if (!user?.uid) return;
    const ref = doc(db, "watchlists", user.uid);
    const docSnap = await getDoc(ref);
    if (!docSnap.exists()) return;
  
    const data = docSnap.data();
    const updatedItems = data.items.filter(
      (m) => !selectedMovies.includes(m.title)
    );
  
    await updateDoc(ref, { items: updatedItems });
    setWatchlist(updatedItems);
    setSelectedMovies([]);
  };

  const sortMovies = (a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.imdbRating || 0) - (a.imdbRating || 0);
      case "runtime":
        return (b.runtimeMinutes || 0) - (a.runtimeMinutes || 0);
      case "title":
        return (a.title || "").localeCompare(b.title || "");
      case "year":
        return (parseInt(b.year) || 0) - (parseInt(a.year) || 0); // Newest first
      case "oldest":
        return (parseInt(a.year) || 0) - (parseInt(b.year) || 0); // Oldest first
      default:
        return 0;
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
    (
      (movie.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (movie.cast || movie.actors || "").toLowerCase().includes(search.toLowerCase()) ||
      (movie.director || (Array.isArray(movie.directors) ? movie.directors.join(', ') : movie.directors) || "").toLowerCase().includes(search.toLowerCase())
    ) &&
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
            {/* === Smart Search === */}
<div className="flex flex-col gap-6 mb-8 items-center">
  <SmartSearch watchlist={watchlist} setFilteredList={setSmartResults} />

  {/* Title, Cast, Director Search */}
  <Input
    placeholder="Search title, cast, or director..."
    value={search}
    onChange={(e) => {
      setSearch(e.target.value);
      setCurrentPage(1);
    }}
    className="w-full max-w-md p-2 text-sm border rounded shadow-sm"
  />
</div>

{/* === Filters Section === */}
<div className="bg-white border rounded-lg shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">

  {/* Genres Dropdown */}
  <div className="relative" ref={genresRef}>
    <button
      onClick={() => setShowGenres(!showGenres)}
      className="w-full p-2 text-sm border rounded hover:bg-gray-50 text-left"
    >
      Genres {selectedGenres.length > 0 ? `(${selectedGenres.length})` : ""}
    </button>
    {showGenres && (
      <div className="absolute mt-2 w-full bg-white border rounded shadow-md max-h-48 overflow-auto p-3 text-sm z-50">
        {uniqueGenres.map((g) => (
          <label key={g} className="flex items-center gap-1 mb-1">
            <input
              type="checkbox"
              checked={selectedGenres.includes(g)}
              onChange={(e) =>
                setSelectedGenres((prev) =>
                  e.target.checked
                    ? [...prev, g]
                    : prev.filter((genre) => genre !== g)
                )
              }
            />
            {g}
          </label>
        ))}
      </div>
    )}
  </div>

  {/* Types Dropdown */}
  <div className="relative" ref={typesRef}>
    <button
      onClick={() => setShowTypes(!showTypes)}
      className="w-full p-2 text-sm border rounded hover:bg-gray-50 text-left"
    >
      Types {selectedTypes.length > 0 ? `(${selectedTypes.length})` : ""}
    </button>
    {showTypes && (
      <div className="absolute mt-2 w-full bg-white border rounded shadow-md max-h-48 overflow-auto p-3 text-sm z-50">
        {uniqueTypes.map((type) => (
          <label key={type} className="flex items-center gap-1 mb-1">
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={(e) =>
                setSelectedTypes((prev) =>
                  e.target.checked
                    ? [...prev, type]
                    : prev.filter((t) => t !== type)
                )
              }
            />
            {type}
          </label>
        ))}
      </div>
    )}
  </div>

  {/* Decades Select */}
  <select
    value={selectedDecade || ""}
    onChange={(e) => setSelectedDecade(e.target.value ? Number(e.target.value) : null)}
    className="w-full p-2 text-sm border rounded hover:shadow-sm hover:bg-gray-50"
  >
    <option value="">All Decades</option>
    {availableDecades.map((decade) => (
      <option key={decade} value={decade}>
        {decade}s
      </option>
    ))}
  </select>

  {/* Ratings Select */}
  <select
    value={minRating}
    onChange={(e) => setMinRating(Number(e.target.value))}
    className="w-full p-2 text-sm border rounded hover:shadow-sm hover:bg-gray-50"
  >
    <option value={0}>All Ratings</option>
    <option value={5}>5.0+ IMDb</option>
    <option value={6}>6.0+ IMDb</option>
    <option value={7}>7.0+ IMDb</option>
    <option value={8}>8.0+ IMDb</option>
  </select>

  {/* Sort Select */}
  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="w-full p-2 text-sm border rounded hover:shadow-sm hover:bg-gray-50"
  >
    <option value="rating">Sort by IMDb Rating</option>
    <option value="runtime">Sort by Runtime (Longest First)</option>
    <option value="title">Sort Alphabetically</option>
    <option value="year">Sort by Newest</option>
    <option value="oldest">Sort by Oldest</option>
  </select>

  {/* Release Status Select */}
  <select
    value={releaseStatus}
    onChange={(e) => setReleaseStatus(e.target.value)}
    className="w-full p-2 text-sm border rounded hover:shadow-sm hover:bg-gray-50"
  >
    <option value="all">All Releases</option>
    <option value="released">Released Only</option>
    <option value="unreleased">Unreleased Only</option>
  </select>

  {/* Titles Per Page Select */}
  <select
    value={titlesPerPage}
    onChange={(e) => {
      setTitlesPerPage(Number(e.target.value));
      setCurrentPage(1);
    }}
    className="w-full p-2 text-sm border rounded hover:shadow-sm hover:bg-gray-50"
  >
    <option value={10}>10 titles per page</option>
    <option value={20}>20 titles per page</option>
    <option value={50}>50 titles per page</option>
  </select>

  {/* Checkboxes */}
  <div className="flex flex-col gap-2">
    <label className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={hideSeen}
        onChange={() => setHideSeen(!hideSeen)}
      />
      Hide Seen
    </label>
    <label className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={recentOnly}
        onChange={() => setRecentOnly(!recentOnly)}
      />
      Recently Added (30d)
    </label>
  </div>
</div>

{/* === Clear Filters Button === */}
<div className="flex justify-center mb-8">
  <button
    onClick={clearFilters}
    className="px-4 py-2 text-sm border rounded hover:shadow-sm hover:bg-gray-50"
  >
    Clear Filters
  </button>
</div>


            {filtered.length === 0 ? <p className="text-center text-gray-500 mt-10">No movies found.</p> : (
              <div className="space-y-6">
                <div className="text-center text-sm text-gray-600 mb-6">
                  {filtered.length} / {watchlist.length} titles showing
                </div>
                {currentTitles.map((movie, idx) => (
               <Card
               key={movie.imdbID || movie.title || idx}
               className="flex bg-white rounded-lg border shadow p-4 gap-4 transition-all duration-200 hover:shadow-lg"
             >
               {/* Poster */}
               <img
                 src={movie.poster}
                 alt={movie.title}
                 className="w-[80px] h-[120px] object-cover rounded-md"
               />
             
               {/* Movie Info */}
               <div className="flex-1 flex flex-col justify-between">
             
                 {/* Title Row: Checkbox + Title + Remove */}
                 <div className="flex justify-between items-start mb-2">
                   {/* Left: Checkbox + Title */}
                   <div className="flex items-center gap-2">
                     {/* Select Checkbox */}
                     <input
                       type="checkbox"
                       checked={selectedMovies.includes(movie.title)}
                       onChange={(e) => {
                         if (e.target.checked) {
                           setSelectedMovies((prev) => [...prev, movie.title]);
                         } else {
                           setSelectedMovies((prev) =>
                             prev.filter((title) => title !== movie.title)
                           );
                         }
                       }}
                     />
                     {/* Title */}
                     <h2 className="text-lg font-bold leading-tight">
                       <a
                         href={`https://www.imdb.com/title/${movie.imdbID || movie.imdbId}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="hover:underline text-[#121212]"
                       >
                         {idx + 1}. {highlightMatch(movie.title, search)}
                       </a>
                     </h2>
                   </div>
             
                   {/* Right: Remove Button */}
                   <button
                     onClick={() => {
                       if (confirm(`Are you sure you want to remove "${movie.title}"?`)) {
                         removeMovie(movie);
                       }
                     }}
                     className="text-red-500 text-lg hover:underline"
                     title="Remove from watchlist"
                   >
                     ❌
                   </button>
                 </div>
             
                 {/* Meta Info */}
                 <div className="text-xs text-gray-600 mb-2 flex flex-wrap gap-2">
                   {movie.year && <span>{movie.year}</span>}
                   {movie.runtimeMinutes && (
                     <span>• {Math.floor(movie.runtimeMinutes / 60)}h {movie.runtimeMinutes % 60}m</span>
                   )}
                   {movie.type && (
                     <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                       {movie.type}
                     </span>
                   )}
                 </div>
             
                 {/* Badges */}
                 <div className="flex flex-wrap gap-2 text-xs mt-2">
                   {movie.seen && (
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold">
                       ✅ Seen
                     </span>
                   )}
                   {movie.genres?.split(", ").map((g) => (
                     <span key={g} className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-800">
                       {g}
                     </span>
                   ))}
                 </div>
             
                 {/* Plot */}
                 {movie.plot && (
                   <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                     {highlightMatch(movie.plot, search)}
                   </p>
                 )}
             
                 {/* Director */}
                 {(movie.director || movie.directors) && (
                   <p className="text-xs text-gray-600 mt-1">
                     <span className="font-semibold">Director:</span>{" "}
                     <a
                       href={`https://www.imdb.com/find?q=${encodeURIComponent(movie.director || (Array.isArray(movie.directors) ? movie.directors.join(', ') : movie.directors))}&s=nm`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="text-blue-600 hover:underline"
                     >
                       {highlightMatch(movie.director || (Array.isArray(movie.directors) ? movie.directors.join(', ') : movie.directors), search)}
                     </a>
                   </p>
                 )}
             
                 {/* Cast */}
                 {(movie.cast || movie.actors) && (
                   <div className="text-xs text-gray-600 mt-1">
                     <span className="font-semibold">Cast:</span>{" "}
                     <span className="text-blue-600 hover:underline">
                       <CastWithExpand castString={movie.cast || movie.actors} search={search} />
                     </span>
                   </div>
                 )}
             
                 {/* Seen Toggle */}
                 <label className="inline-flex items-center gap-2 mt-2 text-sm">
                   <input
                     type="checkbox"
                     checked={movie.seen || false}
                     onChange={() => toggleSeen(movie)}
                   />
                   Mark as Seen
                 </label>
             
               </div>
             </Card>
                             
                
                ))}
              <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">

              {/* Prev Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>

              {/* Page Numbers */}
              {Array.from({ length: Math.ceil(displayList.length / titlesPerPage) }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1 border rounded ${currentPage === idx + 1 ? "bg-gray-200 font-semibold" : ""}`}
                >
                  {idx + 1}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(displayList.length / titlesPerPage))
                  )
                }
                disabled={currentPage === Math.ceil(displayList.length / titlesPerPage)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>

              </div>
              </div>
            )}
            {selectedMovies.length > 0 && (
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={markSelectedAsSeen}
                  className="px-4 py-2 text-sm border rounded bg-green-100 text-green-800 hover:bg-green-200"
                >
                  Mark Selected as Seen
                </button>
                <button
                  onClick={removeSelectedMovies}
                  className="px-4 py-2 text-sm border rounded bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Remove Selected
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
