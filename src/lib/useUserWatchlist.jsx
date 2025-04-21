import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export function useUserWatchlist(uid) {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!uid) {
        try {
          const res = await fetch("/imdb_watchlist-sample.json");
          if (!res.ok) {
            throw new Error("Failed to load fallback: " + res.status);
          }
          const json = await res.json();
          setWatchlist(json);
        } catch (err) {
          console.error("🔥 Fallback JSON failed to load:", err);
          setWatchlist([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const docRef = doc(db, "watchlists", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setWatchlist(docSnap.data().items || []);
        } else {
          // fallback for new users without a saved list
          try {
            const res = await fetch("/imdb_watchlist-sample.json");
            if (!res.ok) throw new Error("Fallback fetch failed");
            const fallback = await res.json();
            setWatchlist(fallback);
          } catch (err) {
            console.error("❌ Failed to load fallback for new user:", err);
            setWatchlist([]);
          }
        }
      } catch (err) {
        console.error("❌ Error loading Firestore watchlist:", err);
        setWatchlist([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [uid]);

  return { watchlist, setWatchlist, loading };
}