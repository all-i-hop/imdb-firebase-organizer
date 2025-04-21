import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useUserWatchlist } from "@/lib/useUserWatchlist";
import Toast from "@/components/ui/toast"; // 👈 Custom toast component

export default function Profile() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const { watchlist, setWatchlist } = useUserWatchlist(user?.uid);

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
        throw new Error("Invalid format: expected an array of items.");
      }

      const ref = doc(db, "watchlists", user.uid);
      await setDoc(ref, { items: json });
      setWatchlist(json);

      setToast({ message: "✅ Watchlist imported successfully.", type: "success" });
    } catch (err) {
      console.error("Import error:", err);
      setToast({ message: `❌ Failed to import: ${err.message}`, type: "error" });
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
