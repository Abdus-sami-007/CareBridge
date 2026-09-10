import { supabase, isSupabaseConfigured } from "./supabase";
import { mockCheckins } from "../data/mockData";

export async function getCheckins(victimId) {
  if (!isSupabaseConfigured || !supabase) {
    return mockCheckins[victimId] || mockCheckins["V001"] || [];
  }

  try {
    const { data, error } = await supabase
      .from("checkins")
      .select("*")
      .eq("victim_id", victimId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Supabase checkins error, using mock history:", error.message);
      return mockCheckins[victimId] || [];
    }

    return (data && data.length > 0) ? data : (mockCheckins[victimId] || []);
  } catch (err) {
    console.warn("Using mock checkins fallback due to error:", err);
    return mockCheckins[victimId] || [];
  }
}

export async function recordCheckin(checkinData) {
  const vid = checkinData.victim_id || "V001";
  
  if (!isSupabaseConfigured || !supabase) {
    if (!mockCheckins[vid]) {
      mockCheckins[vid] = [];
    }
    const newRecord = {
      id: `c_${Date.now()}`,
      victim_id: vid,
      message: checkinData.message,
      score: checkinData.score,
      risk_category: checkinData.risk_category,
      triggers: checkinData.triggers || [],
      intervention: checkinData.intervention || "Counselor Review",
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    mockCheckins[vid].push(newRecord);
    return newRecord;
  }

  try {
    const { data, error } = await supabase
      .from("checkins")
      .insert([checkinData])
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error("Failed to insert check-in to Supabase:", err);
    throw err;
  }
}
