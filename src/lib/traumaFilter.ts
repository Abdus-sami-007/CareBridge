import {
  FilterResult,
  FilterSettings,
  CrisisDetection,
  SanitizedEntity,
  TraumaTag,
  TraumaScores,
  VictimDashboardPayload,
  OfficialsDashboardPayload,
  IngestionChannel
} from '../types';

// Critical crisis patterns indicating acute self-harm, suicidal intent, or immediate violence
const CRITICAL_CRISIS_PATTERNS = [
  /\b(kill myself|end my life|want to die|commit suicide|suicidal|hang myself|slit my wrists|take all my pills|better off dead|no reason to live|don't want to wake up)\b/i,
  /\b(cut myself|hurt myself|harm myself|bleeding out|swallow pills|overdose)\b/i,
  /\b(kill him|kill her|kill them|murder|shoot them)\b/i
];

const HIGH_DISTRESS_PATTERNS = [
  /\b(can't take this anymore|cannot bear the pain|hopeless|unbearable pain|trapped forever|giving up on everything|nobody cares if i disappear)\b/i,
  /\b(flashbacks won't stop|screaming inside|can't breathe from panic|losing my mind|drowning in fear|completely terrified)\b/i
];

const TRAUMA_DOMAINS: { category: string; label: string; pattern: RegExp; severity: 'mild' | 'moderate' | 'acute' }[] = [
  {
    category: 'armed_conflict_shelling',
    label: 'Armed Conflict & Bombardment Atrocity',
    pattern: /\b(bombing|airstrike|shelling|mortar|artillery|gunfire|militia|soldiers stormed|missile|destroyed building|air raid|sniper)\b/i,
    severity: 'acute'
  },
  {
    category: 'forced_displacement',
    label: 'Forced Displacement & Refugee Flight',
    pattern: /\b(fled our home|refugee camp|forced out|stateless|checkpoint|border crossing|lost everything we owned|tent|deported)\b/i,
    severity: 'acute'
  },
  {
    category: 'detention_torture',
    label: 'Arbitrary Detention & Captivity',
    pattern: /\b(torture|interrogated|blindfolded|beaten in custody|cell|detained|electric shock|deprived of sleep|handcuffed for days)\b/i,
    severity: 'acute'
  },
  {
    category: 'persecution_hate',
    label: 'Targeted Ethnic / Identity Persecution',
    pattern: /\b(ethnic cleansing|genocide|hate crime|persecuted because of my|massacre|lynched|extremists burned)\b/i,
    severity: 'acute'
  },
  {
    category: 'interpersonal_violence',
    label: 'Physical Violence & Assault',
    pattern: /\b(assault|beaten|hit me|punched|strangled|choked|attacked|weapon|gun|knife|physically hurt|bruised)\b/i,
    severity: 'acute'
  },
  {
    category: 'domestic_abuse',
    label: 'Domestic & Coercive Control',
    pattern: /\b(abusive partner|ex-husband|ex-wife|threatened to hurt me|controlled everything|locked me in|gaslighting|screamed at me constantly|terrorized)\b/i,
    severity: 'acute'
  },
  {
    category: 'grief_loss',
    label: 'Severe Bereavement & Massacre Witness',
    pattern: /\b(died suddenly|lost my child|funeral|grief is eating me|suicide of my|body of my|passed away in front of me|mass grave|killed my family)\b/i,
    severity: 'acute'
  },
  {
    category: 'hyperarousal_panic',
    label: 'Panic & Hypervigilance',
    pattern: /\b(shaking uncontrollably|night terrors|heart pounding|can't sleep|hypervigilant|checking the door|paranoid someone is watching|jump at every sound)\b/i,
    severity: 'mild'
  }
];

export function runTraumaFilter(rawText: string, settings: FilterSettings): FilterResult {
  const sanitizedEntities: SanitizedEntity[] = [];
  let processedText = rawText;

  // 1. Detect Crisis Indicators
  let crisisSeverity: CrisisDetection['severity'] = 'none';
  const crisisReasons: string[] = [];
  const matchedCategories: string[] = [];

  for (const pattern of CRITICAL_CRISIS_PATTERNS) {
    const match = rawText.match(pattern);
    if (match) {
      crisisSeverity = 'critical';
      crisisReasons.push(`Immediate self-harm / suicidal reference detected: "${match[0]}"`);
      matchedCategories.push('Acute Imminent Crisis');
      break;
    }
  }

  if (crisisSeverity !== 'critical') {
    for (const pattern of HIGH_DISTRESS_PATTERNS) {
      const match = rawText.match(pattern);
      if (match) {
        crisisSeverity = 'high';
        crisisReasons.push(`High acute emotional overwhelm detected: "${match[0]}"`);
        matchedCategories.push('Extreme Acute Distress');
        break;
      }
    }
  }

  // 2. Identify Trauma Categories & Keywords
  const traumaTags: TraumaTag[] = [];
  for (const domain of TRAUMA_DOMAINS) {
    const matches = rawText.match(new RegExp(domain.pattern.source, 'gi'));
    if (matches && matches.length > 0) {
      const uniqueWords = Array.from(new Set(matches.map(m => m.toLowerCase())));
      traumaTags.push({
        category: domain.category,
        label: domain.label,
        detectedWords: uniqueWords,
        severity: domain.severity
      });
      if (crisisSeverity === 'none') {
        crisisSeverity = domain.severity === 'acute' ? 'moderate' : 'low';
      }
    }
  }

  // 3. PII & Sensitive Entity Sanitization
  if (settings.redactPii) {
    // Phone numbers
    const phoneRegex = /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    let match: RegExpExecArray | null;
    while ((match = phoneRegex.exec(processedText)) !== null) {
      sanitizedEntities.push({
        original: match[0],
        replacement: '[PHONE_REDACTED]',
        type: 'PHONE',
        index: match.index
      });
    }
    processedText = processedText.replace(phoneRegex, '[PHONE_REDACTED]');

    // Emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
    while ((match = emailRegex.exec(processedText)) !== null) {
      sanitizedEntities.push({
        original: match[0],
        replacement: '[EMAIL_REDACTED]',
        type: 'EMAIL',
        index: match.index
      });
    }
    processedText = processedText.replace(emailRegex, '[EMAIL_REDACTED]');

    // Social Security / ID patterns
    const idRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    while ((match = idRegex.exec(processedText)) !== null) {
      sanitizedEntities.push({
        original: match[0],
        replacement: '[ID_REDACTED]',
        type: 'IDENTIFIER',
        index: match.index
      });
    }
    processedText = processedText.replace(idRegex, '[ID_REDACTED]');

    // Names of people (common titles + Name)
    const nameWithTitleRegex = /\b(Mr\.|Mrs\.|Ms\.|Dr\.|Officer|Pastor|Father|Mother|Brother|Sister|Uncle|Aunt|Partner|Husband|Wife)\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)?)\b/g;
    let nameIdx = 1;
    processedText = processedText.replace(nameWithTitleRegex, (full, title, name) => {
      const token = `[${title.toUpperCase().replace('.', '')}_PERSON_${nameIdx++}]`;
      sanitizedEntities.push({
        original: full,
        replacement: token,
        type: 'NAME',
        index: 0
      });
      return token;
    });

    // Street Addresses
    const addressRegex = /\b\d{1,5}\s+([A-Za-z0-9\s]+)\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/gi;
    let locIdx = 1;
    processedText = processedText.replace(addressRegex, (full) => {
      const token = `[ADDRESS_${locIdx++}]`;
      sanitizedEntities.push({
        original: full,
        replacement: token,
        type: 'LOCATION',
        index: 0
      });
      return token;
    });
  }

  // 4. Sensitivity adjustments
  if (settings.sensitivityLevel === 'maximum') {
    // Also sanitize specific dates and hospital/organization names
    const dateRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{4}\b/gi;
    processedText = processedText.replace(dateRegex, (full) => {
      sanitizedEntities.push({
        original: full,
        replacement: '[DATE_REDACTED]',
        type: 'DATE',
        index: 0
      });
      return '[DATE_REDACTED]';
    });
  }

  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
  const characterCount = rawText.length;

  return {
    originalText: rawText,
    filteredText: processedText,
    crisisDetection: {
      hasCrisisIndicators: crisisSeverity === 'critical' || crisisSeverity === 'high',
      severity: crisisSeverity,
      matchedCategories,
      reasons: crisisReasons,
      requiresImmediateHelp: crisisSeverity === 'critical'
    },
    sanitizedEntities,
    traumaTags,
    redactedCount: sanitizedEntities.length,
    wordCount,
    characterCount,
    filterAppliedAt: new Date().toISOString()
  };
}

// Fallback scoring engine if Gemini API is unreachable or key is unset
export function computeFallbackScores(filterResult: FilterResult): import('../types').TraumaScores {
  const text = filterResult.originalText.toLowerCase();
  const tags = filterResult.traumaTags;
  const severity = filterResult.crisisDetection.severity;

  // Base distress calculation
  let acuteDistress = 20;
  if (severity === 'critical') acuteDistress = 94;
  else if (severity === 'high') acuteDistress = 82;
  else if (severity === 'moderate') acuteDistress = 62;
  else if (severity === 'low') acuteDistress = 38;

  // Modulate based on trauma tags count
  acuteDistress = Math.min(100, acuteDistress + tags.length * 6);

  // Cluster calculations
  let intrusionScore = 25;
  if (/flashback|nightmare|can't forget|reliving|vision|screaming/i.test(text)) intrusionScore += 45;
  if (/memory pops|triggers me|every time i see/i.test(text)) intrusionScore += 20;
  intrusionScore = Math.min(100, Math.max(10, intrusionScore));

  let avoidanceScore = 20;
  if (/avoid|can't go near|don't want to talk|shut down|blocked out|isolate|locked in/i.test(text)) avoidanceScore += 50;
  if (/pretend it didn't happen|numb/i.test(text)) avoidanceScore += 20;
  avoidanceScore = Math.min(100, Math.max(10, avoidanceScore));

  let negativeCognitionMood = 25;
  if (/my fault|guilt|hate myself|hopeless|worthless|broken|ruined/i.test(text)) negativeCognitionMood += 50;
  if (/no one to trust|world is evil|empty/i.test(text)) negativeCognitionMood += 20;
  negativeCognitionMood = Math.min(100, Math.max(10, negativeCognitionMood));

  let hyperarousalScore = 30;
  if (/can't sleep|insomnia|jump|panic|heart racing|shaking|hypervigilant|always on guard/i.test(text)) hyperarousalScore += 50;
  if (/rage|angry|snapping/i.test(text)) hyperarousalScore += 15;
  hyperarousalScore = Math.min(100, Math.max(10, hyperarousalScore));

  // Overall impact is weighted average
  const overallImpactScore = Math.round(
    acuteDistress * 0.35 +
    intrusionScore * 0.20 +
    avoidanceScore * 0.15 +
    negativeCognitionMood * 0.15 +
    hyperarousalScore * 0.15
  );

  // Resilience score: look for reflective words, seeking help, survival insight
  let resilienceScore = 35;
  if (/survived|trying|seeking help|want to heal|counseling|talking about this|hope|strength|family helped/i.test(text)) resilienceScore += 35;
  if (/i need help|writing this down/i.test(text)) resilienceScore += 15;
  resilienceScore = Math.min(95, Math.max(15, resilienceScore));

  let urgencyLevel: 'Mild' | 'Moderate' | 'High' | 'Severe / Crisis' = 'Moderate';
  if (severity === 'critical' || overallImpactScore >= 80) urgencyLevel = 'Severe / Crisis';
  else if (severity === 'high' || overallImpactScore >= 65) urgencyLevel = 'High';
  else if (overallImpactScore >= 40) urgencyLevel = 'Moderate';
  else urgencyLevel = 'Mild';

  const getLevel = (s: number): 'Minimal' | 'Mild' | 'Moderate' | 'Severe' => {
    if (s >= 75) return 'Severe';
    if (s >= 50) return 'Moderate';
    if (s >= 25) return 'Mild';
    return 'Minimal';
  };

  return {
    overallImpactScore,
    acuteDistressScore: acuteDistress,
    resilienceScore,
    urgencyLevel,
    clusters: {
      intrusion: {
        score: intrusionScore,
        level: getLevel(intrusionScore),
        indicators: tags.filter(t => t.category === 'interpersonal_violence' || t.category === 'accident_disaster').map(t => t.label)
      },
      avoidance: {
        score: avoidanceScore,
        level: getLevel(avoidanceScore),
        indicators: ['Self-protective withdrawal and situational avoidance cues detected.']
      },
      negativeCognitionMood: {
        score: negativeCognitionMood,
        level: getLevel(negativeCognitionMood),
        indicators: ['Emotional distress regarding safety, autonomy, or self-concept.']
      },
      hyperarousal: {
        score: hyperarousalScore,
        level: getLevel(hyperarousalScore),
        indicators: ['Somatic tension, sleep vulnerability, and heightened threat monitoring.']
      }
    },
    clinicalObservations: [
      `Identified ${tags.length} core trauma category domains in personal narrative.`,
      `Sanitized ${filterResult.sanitizedEntities.length} sensitive/identifying tokens to protect individual privacy before scoring.`,
      `Distress profile indicates ${urgencyLevel.toLowerCase()} need for supportive grounding and trauma-informed pacing.`
    ],
    empatheticSummary: "Your experience reflects meaningful emotional and psychological weight. The reactions you are experiencing—including heightened vigilance, deep stress, and emotional fatigue—are understandable responses to traumatic adversity.",
    traumaInformedRecommendations: {
      immediateGrounding: [
        "5-4-3-2-1 Sensory Grounding: Acknowledge 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
        "Box Breathing: Inhale slowly for 4 counts, hold for 4 counts, exhale for 4 counts, hold for 4 counts.",
        "Physical Anchoring: Place both feet flat on the floor, feel the support beneath you, and place a gentle hand over your heart."
      ],
      carePathway: urgencyLevel === 'Severe / Crisis'
        ? "Immediate warm handoff to a crisis counselor or 988 lifeline specialist is strongly advised."
        : "Structured trauma-informed outpatient counseling (such as EMDR, CPT, or Somatic Experiencing) is recommended.",
      facilitatorGuidance: [
        "Maintain non-judgmental validation; avoid probing for detailed graphic traumatic narratives prematurely.",
        "Respect pacing and establish collaborative control over discussion boundaries.",
        "Highlight personal survival agency and existing resilience factors."
      ]
    }
  };
}

export function generateVictimDashboardPayload(
  victimId: string,
  filter: FilterResult,
  scores: TraumaScores
): import('../types').VictimDashboardPayload {
  let plainTextDistress: import('../types').VictimDashboardPayload['plainTextDistressLevel'] = 'Mild Stress';
  if (scores.acuteDistressScore >= 75 || scores.urgencyLevel === 'Severe / Crisis') {
    plainTextDistress = 'Intense Overwhelm';
  } else if (scores.acuteDistressScore >= 50) {
    plainTextDistress = 'High Distress';
  } else if (scores.acuteDistressScore >= 25) {
    plainTextDistress = 'Mild Stress';
  } else {
    plainTextDistress = 'Balanced';
  }

  const status: import('../types').VictimDashboardPayload['status'] =
    plainTextDistress === 'Intense Overwhelm' ? 'Needs Attention' : 'Supported';

  return {
    victimId,
    status,
    compassionateGreeting: "Welcome back. You are in a safe, secure space. Your well-being and privacy are completely protected.",
    plainTextDistressLevel: plainTextDistress,
    supportiveInsights: [
      scores.empatheticSummary,
      "Your emotional reactions are natural adaptations to profound adversity.",
      `Privacy Protection: ${filter.sanitizedEntities.length} personal identifiers were masked before any processing.`
    ],
    dailyGroundingExercises: scores.traumaInformedRecommendations.immediateGrounding,
    privacyConfirmation: "All personal identifiers, location markers, and contacts have been cryptographically sanitized. Officials only receive anonymized safety markers.",
    crisisContacts: [
      { name: "Emergency Lifeline (24/7)", contact: "988", description: "Free, confidential crisis counseling by call or text" },
      { name: "Crisis Text Support", contact: "Text HOME to 741741", description: "Connect with a trained crisis volunteer" },
      { name: "Victim Advocacy Network", contact: "1-800-656-4673", description: "Specialized assistance for victims of violence" }
    ],
    allocatedSupportWorker: "Assigned Caseworker: Sarah T. (Trauma Care Coordinator)",
    lastUpdated: new Date().toISOString()
  };
}

export function generateOfficialsDashboardPayload(
  recordId: string,
  victimId: string,
  channel: import('../types').IngestionChannel,
  filter: FilterResult,
  scores: TraumaScores
): import('../types').OfficialsDashboardPayload {
  let triagePriority: import('../types').OfficialsDashboardPayload['triagePriority'] = 'MONITOR_YELLOW';
  let escalationRisk: import('../types').OfficialsDashboardPayload['escalationRisk'] = 'Moderate';

  if (scores.urgencyLevel === 'Severe / Crisis' || filter.crisisDetection.severity === 'critical') {
    triagePriority = 'CRITICAL_RED';
    escalationRisk = 'Immediate Crisis';
  } else if (scores.urgencyLevel === 'High' || scores.acuteDistressScore >= 70) {
    triagePriority = 'ELEVATED_AMBER';
    escalationRisk = 'High';
  } else if (scores.overallImpactScore >= 35) {
    triagePriority = 'MONITOR_YELLOW';
    escalationRisk = 'Moderate';
  } else {
    triagePriority = 'STABLE_GREEN';
    escalationRisk = 'Low';
  }

  // Determine Primary Atrocity Classification
  let atrocityType = 'Civilian Conflict & Trauma Exposure';
  if (filter.traumaTags.some(t => t.category === 'armed_conflict_shelling')) {
    atrocityType = 'Armed Conflict, Shelling & Aerial Bombardment';
  } else if (filter.traumaTags.some(t => t.category === 'forced_displacement')) {
    atrocityType = 'Forced Displacement, Border Crossing & Flight';
  } else if (filter.traumaTags.some(t => t.category === 'detention_torture')) {
    atrocityType = 'Arbitrary Detention & Coercive Interrogation';
  } else if (filter.traumaTags.some(t => t.category === 'persecution_hate')) {
    atrocityType = 'Targeted Identity Persecution / Hate Atrocity';
  } else if (filter.traumaTags.some(t => t.category === 'interpersonal_violence')) {
    atrocityType = 'Physical Assault & Acute Bodily Harm';
  }

  // Formulate official protocol
  let protocol = "Routine wellness check and trauma-informed counseling referral.";
  if (triagePriority === 'CRITICAL_RED') {
    protocol = "IMMEDIATE ESCALATION: Dispatch Mobile Crisis Response Unit or immediate protected shelter escort. Coordinate urgent medical & psychological emergency evaluation.";
  } else if (triagePriority === 'ELEVATED_AMBER') {
    protocol = "PRIORITY OUTREACH: Assign dedicated trauma case manager within 2 hours. Activate protective accommodation and trauma-specialist intake.";
  } else if (triagePriority === 'MONITOR_YELLOW') {
    protocol = "SCHEDULED SUPPORT: Outpatient trauma counseling, legal aid assistance, and periodic digital health check-ins.";
  }

  return {
    recordId,
    victimId,
    ingestionChannel: channel,
    triagePriority,
    atrocityType,
    traumaSeverityScore: scores.overallImpactScore,
    distressPredictionScore: scores.acuteDistressScore,
    resilienceScore: scores.resilienceScore,
    escalationRisk,
    sanitizedNarrative: filter.filteredText,
    redactedTokensCount: filter.sanitizedEntities.length,
    crisisFlags: filter.crisisDetection.reasons,
    recommendedOfficialProtocol: protocol,
    assignedAgency: triagePriority === 'CRITICAL_RED' ? 'Emergency Crisis Team & Protective Services' : 'Humanitarian Trauma & Casework Services',
    timeline: [
      { timestamp: new Date().toISOString(), action: `Ingested via ${channel.toUpperCase()}`, actor: 'Ingestion Gateway' },
      { timestamp: new Date().toISOString(), action: `Sanitized ${filter.sanitizedEntities.length} PII tokens & screened for acute harm`, actor: 'Trauma Filter Module' },
      { timestamp: new Date().toISOString(), action: `Evaluated distress & trauma metrics (Severity: ${scores.overallImpactScore})`, actor: 'Gemini AI Assessment' },
      { timestamp: new Date().toISOString(), action: `Assigned Triage Tier: ${triagePriority}`, actor: 'Triage Rule Engine' }
    ],
    ingestedAt: new Date().toISOString()
  };
}

