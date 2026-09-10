/**
 * Pre-seeded Mock Data for CareBridge Development & Testing
 * Allows full offline operation before Supabase / FastAPI connections are attached.
 */

export const mockVictims = [
  {
    id: "V001",
    name: "Ravi Kumar",
    case_id: "AT-001",
    risk_level: "CRITICAL",
    latest_score: 91,
    last_checkin: "2 min ago",
    assigned_officer: "Officer Sharma",
    location: "Sector 14, Zone B",
    contact_phone: "+91 98765 43210"
  },
  {
    id: "V002",
    name: "Sita Devi",
    case_id: "AT-002",
    risk_level: "HIGH",
    latest_score: 72,
    last_checkin: "10 min ago",
    assigned_officer: "Officer Verma",
    location: "Block C, Model Town",
    contact_phone: "+91 98123 67890"
  },
  {
    id: "V003",
    name: "Anil Kumar",
    case_id: "AT-003",
    risk_level: "MEDIUM",
    latest_score: 48,
    last_checkin: "25 min ago",
    assigned_officer: "Officer Rao",
    location: "Rajiv Nagar, East",
    contact_phone: "+91 99887 11223"
  },
  {
    id: "V004",
    name: "Meena Devi",
    case_id: "AT-004",
    risk_level: "LOW",
    latest_score: 18,
    last_checkin: "1 hr ago",
    assigned_officer: "Officer Singh",
    location: "Vasant Vihar",
    contact_phone: "+91 97112 33445"
  },
  {
    id: "V005",
    name: "Pooja Sharma",
    case_id: "AT-005",
    risk_level: "HIGH",
    latest_score: 65,
    last_checkin: "2 hrs ago",
    assigned_officer: "Officer Sharma",
    location: "Central Colony",
    contact_phone: "+91 98991 22334"
  },
  {
    id: "V006",
    name: "Rajesh Patel",
    case_id: "AT-006",
    risk_level: "LOW",
    latest_score: 22,
    last_checkin: "4 hrs ago",
    assigned_officer: "Officer Rao",
    location: "Green Park",
    contact_phone: "+91 98111 00998"
  }
];

export const mockCheckins = {
  V001: [
    { id: "c101", created_at: "2026-09-09 14:00", score: 22, risk_category: "LOW", message: "Everything is quiet today. Thank you." },
    { id: "c102", created_at: "2026-09-09 16:00", score: 38, risk_category: "MEDIUM", message: "Saw someone waiting near my alleyway." },
    { id: "c103", created_at: "2026-09-09 17:30", score: 55, risk_category: "MEDIUM", message: "Received repeated calls from unknown numbers." },
    { id: "c104", created_at: "2026-09-09 19:00", score: 78, risk_category: "HIGH", message: "Someone knocked loudly on my door and threatened to break in." },
    { id: "c105", created_at: "2026-09-09 19:33", score: 91, risk_category: "CRITICAL", message: "I am scared because they threatened me again and I don't feel safe inside my home.", triggers: ["intimidation", "fear", "immediate_threat"], intervention: "Counselor Dispatch & Protection Request" }
  ],
  V002: [
    { id: "c201", created_at: "2026-09-09 10:00", score: 15, risk_category: "LOW", message: "Doing okay right now." },
    { id: "c202", created_at: "2026-09-09 15:00", score: 45, risk_category: "MEDIUM", message: "Feeling anxious about court hearing tomorrow." },
    { id: "c203", created_at: "2026-09-09 19:25", score: 72, risk_category: "HIGH", message: "They followed me home from work today. I locked all windows.", triggers: ["stalking", "intimidation"], intervention: "Counselor Check-in" }
  ],
  V003: [
    { id: "c301", created_at: "2026-09-09 12:00", score: 30, risk_category: "MEDIUM", message: "Stressful day, but managing." },
    { id: "c302", created_at: "2026-09-09 19:10", score: 48, risk_category: "MEDIUM", message: "Received a aggressive text message. Feeling uneasy.", triggers: ["verbal_harassment"], intervention: "Standard Monitoring" }
  ],
  V004: [
    { id: "c401", created_at: "2026-09-09 08:00", score: 12, risk_category: "LOW", message: "All safe here. Good morning." },
    { id: "c402", created_at: "2026-09-09 18:35", score: 18, risk_category: "LOW", message: "Attended support session today. Feeling better.", triggers: [], intervention: "None" }
  ],
  V005: [
    { id: "c501", created_at: "2026-09-09 11:00", score: 40, risk_category: "MEDIUM", message: "Some noise outside." },
    { id: "c502", created_at: "2026-09-09 17:35", score: 65, risk_category: "HIGH", message: "Repeated harassment calls asking me to withdraw case.", triggers: ["coercion", "intimidation"], intervention: "Officer Review" }
  ],
  V006: [
    { id: "c601", created_at: "2026-09-09 15:35", score: 22, risk_category: "LOW", message: "Safe and sound at home.", triggers: [], intervention: "None" }
  ]
};
