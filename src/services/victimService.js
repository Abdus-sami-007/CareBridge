import { supabase, isSupabaseConfigured } from "./supabase";
import { mockVictims } from "../data/mockData";

export async function getVictims() {
  if (!isSupabaseConfigured || !supabase) {
    return [...mockVictims].sort((a, b) => b.latest_score - a.latest_score);
  }

  try {
    const { data, error } = await supabase
      .from("victims")
      .select("*")
      .order("latest_score", { ascending: false });

    if (error) {
      console.warn("Supabase query error, defaulting to mock data:", error.message);
      return [...mockVictims].sort((a, b) => b.latest_score - a.latest_score);
    }

    return (data && data.length > 0) ? data : mockVictims;
  } catch (err) {
    console.warn("Using mock victims fallback due to connection error:", err);
    return [...mockVictims].sort((a, b) => b.latest_score - a.latest_score);
  }
}
