import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useUserWatchlist } from "@/lib/useUserWatchlist";
import Toast from "@/components/ui/toast";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(null);
  const { setWatchlist } = useUserWatchlist(user?.uid);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!Array.isArray(json)) {
        throw new Error("Invalid format: expected an array.");
      }

      setPreview(json);
    } catch (err) {
      setToast({ message: `❌ Invalid file: ${err.message}`, type: "error" });
    }
  };

  const sanitizeEntry = (entry) => {
    return {
      ...entry,
      imdbRating: entry.imdbRating === "" ? null : Number(entry.imdbRating),
      runtimeMinutes: entry.runtimeMinutes === "" ? null : Number(entry.runtimeMinutes),
      voteCount: entry.voteCount === "" ? 0 : Number(entry.voteCount),
    };
  };

  const handleImportConfirm = async () => {
    if (!user?.uid || !preview) {
      setToast({ message: "❌ User not signed in or no file selected.", type: "error" });
      return;
    }
  
    try {
      const sanitized = preview.map(sanitizeEntry);
      const ref = doc(db, "watchlists", user.uid);
  
      await setDoc(ref, {
        items: sanitized,
        owner: {
          uid: user.uid,
          name: user.displayName || null,
          email: user.email || null,
        },
        importedAt: new Date().toISOString()
      });
  
      setWatchlist(sanitized);
      setPreview(null);
      setToast({ message: "✅ Watchlist imported successfully.", type: "success" });
    } catch (err) {
      setToast({ message: `❌ Failed to save: ${err.message}`, type: "error" });
    }
  };
  

  if (!user) {
    return <p className="text-center mt-10">Please sign in to manage your profile.</p>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded space-y-4">
      <h1 className="text-2xl font-bold">👤 Profile</h1>
      <p><strong>Name:</strong> {user.displayName}</p>
      <p><strong>Email:</strong> {user.email}</p>

      <div className="mt-6">
        <label className="block font-medium mb-1">📤 Import Watchlist (JSON)</label>
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="border border-gray-300 rounded px-2 py-1 w-full"
        />
      </div>

      {preview && (
        <div className="bg-gray-50 p-4 border rounded mt-4">
          <h2 className="text-sm font-semibold mb-2">Preview ({preview.length} titles)</h2>
          <ul className="text-sm max-h-40 overflow-auto">
            {preview.slice(0, 5).map((movie, i) => (
              <li key={i} className="text-gray-700">
                {movie.title} {movie.year ? `(${movie.year})` : ""}
              </li>
            ))}
            {preview.length > 5 && <li>...and more</li>}
          </ul>
          <button
            onClick={handleImportConfirm}
            className="mt-4 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            ✅ Confirm Import
          </button>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}