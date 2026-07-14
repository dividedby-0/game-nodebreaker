import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { firebaseConfig } from "../config/firebaseConfig.js";

export const LeaderboardService = () => {
  let db = null;
  let ready = false;

  const initialize = () => {
    try {
      const app = initializeApp(firebaseConfig);
      db = initializeFirestore(app, { experimentalForceLongPolling: true });
      ready = true;
    } catch {
      ready = false;
    }
  };

  const submitScore = async ({ name, score, normalNodes, breakableNodes, breakerNodes }) => {
    if (!ready) { return null; }
    try {
      const docRef = await addDoc(collection(db, "scores"), {
        name,
        score,
        normalNodes,
        breakableNodes,
        breakerNodes,
        timestamp: Date.now(),
      });
      return docRef.id;
    } catch {
      return null;
    }
  };

  const getLeaderboard = async (count = 10) => {
    if (!ready) { return []; }
    try {
      const q = query(
        collection(db, "scores"),
        orderBy("score", "desc"),
        limit(count),
      );
      const snapshot = await getDocs(q);
      const entries = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          name: data.name || "ANONYMOUS",
          score: data.score,
          normalNodes: data.normalNodes,
          breakableNodes: data.breakableNodes,
          breakerNodes: data.breakerNodes,
          timestamp: data.timestamp,
        });
      });
      return entries;
    } catch {
      return null;
    }
  };

  return { initialize, submitScore, getLeaderboard };
};
