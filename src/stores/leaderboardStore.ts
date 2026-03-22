import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { firestore, authReady } from "../lib/firebase";
import type { PlayerInfo } from "./singleplayerGameStore";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export async function fetchTopLeaderboard() {
    const q = query(
        collection(firestore, "leaderboard"),
        orderBy("wins", "desc"),
        limit(10)
    );

    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

export async function updateLeaderboard(
    winnerId: string,
    players: PlayerInfo[]
) {
    // Wait for Firebase Auth to be ready
    await authReady;

    await new Promise(r => setTimeout(r, 150));

    const humanPlayers = players.filter((p: PlayerInfo) => !p.id.startsWith("cpu-"));

    console.log("[LEADERBOARD] writing to Firestore", {
        winnerId,
        players: humanPlayers.map(p => p.id),
    });

    for (const p of humanPlayers) {
        const ref = doc(firestore, "leaderboard", p.id);
        const isWinner = p.id === winnerId;

        await setDoc(
            ref,
            {
                username: p.username,
                wins: isWinner ? increment(1) : increment(0),
                losses: isWinner ? increment(0) : increment(1),
                gamesPlayed: increment(1),
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        );
    }
}