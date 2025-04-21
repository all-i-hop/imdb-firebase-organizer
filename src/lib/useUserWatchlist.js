import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export const useUserWatchlist = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const loadJson = async () => {
        setLoading(true);
        try {
          const res = await fetch("/watchlist_flat-sample.json");
          const json = await res.json();
          setWatchlist(json);
        } catch (err) {
          console.error("Error loading fallback JSON:", err);
        }
        setLoading(false);
      };
  
      loadJson();
    }, []);
  
    return { watchlist, setWatchlist: () => {}, loading };
  };
  