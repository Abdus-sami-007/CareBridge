/**
 * Common Risk Level utility function across CareBridge Frontend
 * 
 * Score Table:
 * 0–29   : LOW      🟢
 * 30–59  : MEDIUM   🟡
 * 60–79  : HIGH     🟠
 * 80–100 : CRITICAL 🔴
 */
export function getRiskCategory(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

export function getRiskMeta(scoreOrCategory) {
  let category = typeof scoreOrCategory === "number" 
    ? getRiskCategory(scoreOrCategory) 
    : (scoreOrCategory || "LOW");

  category = category.toUpperCase();

  switch (category) {
    case "CRITICAL":
      return {
        category: "CRITICAL",
        emoji: "🔴",
        badgeStyle: "bg-red-500/10 text-red-400 border-red-500/40 shadow-red-950/40",
        bgLight: "bg-red-500/5",
        border: "border-red-500/30",
        dotColor: "bg-red-500 animate-pulse",
        textHex: "#ef4444"
      };
    case "HIGH":
      return {
        category: "HIGH",
        emoji: "🟠",
        badgeStyle: "bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-amber-950/40",
        bgLight: "bg-amber-500/5",
        border: "border-amber-500/30",
        dotColor: "bg-amber-500",
        textHex: "#f97316"
      };
    case "MEDIUM":
      return {
        category: "MEDIUM",
        emoji: "🟡",
        badgeStyle: "bg-yellow-500/10 text-yellow-400 border-yellow-500/40 shadow-yellow-950/40",
        bgLight: "bg-yellow-500/5",
        border: "border-yellow-500/30",
        dotColor: "bg-yellow-500",
        textHex: "#eab308"
      };
    case "LOW":
    default:
      return {
        category: "LOW",
        emoji: "🟢",
        badgeStyle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-emerald-950/40",
        bgLight: "bg-emerald-500/5",
        border: "border-emerald-500/30",
        dotColor: "bg-emerald-500",
        textHex: "#10b981"
      };
  }
}
