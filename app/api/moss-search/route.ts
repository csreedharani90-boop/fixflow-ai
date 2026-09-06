import { NextResponse } from "next/server";
import { MossClient } from "@moss-dev/moss";

const MOSS_PROJECT_ID = process.env.MOSS_PROJECT_ID!;
const MOSS_PROJECT_KEY = process.env.MOSS_PROJECT_KEY!;
const MOSS_INDEX_NAME =
  process.env.MOSS_INDEX_NAME || "fixflow-knowledge-v2";

// ============================================================
// FIXFLOW KNOWLEDGE BASE
// ============================================================

const knowledgeBase = [
  {
    id: "fx-029",
    text: "E17 motor over-temperature fault. If the motor becomes hot after several minutes, check motor current, mechanical load, cooling airflow, ventilation, and bearing condition.",
    metadata: {
      category: "E17",
      type: "fault",
    },
  },
  {
    id: "fx-003",
    text: "E17 indicates motor over-temperature. Common causes include excessive mechanical load, blocked ventilation, cooling fan failure, high ambient temperature, and excessive motor current.",
    metadata: {
      category: "E17",
      type: "diagnosis",
    },
  },
  {
    id: "fx-004",
    text: "Motor becomes hot after approximately 10 minutes of operation. Check for overload, blocked airflow, ventilation blockage, abnormal current, and cooling system problems.",
    metadata: {
      category: "temperature",
      type: "troubleshooting",
    },
  },
  {
    id: "fx-011",
    text: "Motor overheating can be caused by excessive load, high current, poor ventilation, high ambient temperature, damaged bearings, or inadequate cooling.",
    metadata: {
      category: "overheating",
      type: "cause",
    },
  },
  {
    id: "fx-013",
    text: "For abnormal motor temperature, measure motor current and inspect the cooling fan, ventilation openings, and surrounding airflow before restarting the equipment.",
    metadata: {
      category: "temperature",
      type: "check",
    },
  },
  {
    id: "fx-006",
    text: "If motor current is higher than the rated current, reduce the mechanical load and inspect the motor and controller for abnormal operation.",
    metadata: {
      category: "current",
      type: "check",
    },
  },
  {
    id: "fx-018",
    text: "Blocked ventilation can cause rapid temperature rise. Clean dust and debris from ventilation openings and ensure adequate airflow around the motor.",
    metadata: {
      category: "cooling",
      type: "maintenance",
    },
  },
  {
    id: "fx-021",
    text: "A failed or slow cooling fan can result in motor overheating. Check fan operation before continuing normal operation.",
    metadata: {
      category: "cooling",
      type: "fan",
    },
  },
];

// ============================================================
// SCORE LOCAL KNOWLEDGE
// ============================================================

function scoreDocument(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  let score = 0;

  const terms = [
    "e17",
    "e21",
    "motor",
    "hot",
    "heat",
    "heating",
    "overheating",
    "over-temperature",
    "overcurrent",
    "over-current",
    "current",
    "vibration",
    "load",
    "cooling",
    "fan",
    "ventilation",
    "bearing",
    "temperature",
  ];

  for (const term of terms) {
    if (q.includes(term) && t.includes(term)) {
      score += 2;
    }
  }

  const words = q
    .replace(/[^a-z0-9-]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  for (const word of words) {
    if (t.includes(word)) {
      score += 1;
    }
  }

  return score;
}

// ============================================================
// GET TOP LOCAL EVIDENCE
// ============================================================

function getFallbackEvidence(query: string) {
  return knowledgeBase
    .map((doc) => ({
      id: doc.id,
      text: doc.text,
      metadata: doc.metadata,
      score: scoreDocument(query, doc.text),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ============================================================
// POST API
// ============================================================

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    const query =
      typeof body?.query === "string" && body.query.trim()
        ? body.query.trim()
        : "E17 motor gets hot after 10 minutes";

    let mossConnected = false;
    let mossQuerySuccessful = false;
    let mossError: string | null = null;

    let evidence: any[] = [];

    // ========================================================
    // CONNECT TO REAL MOSS
    // ========================================================

    try {
      if (!MOSS_PROJECT_ID || !MOSS_PROJECT_KEY) {
        throw new Error(
          "Moss credentials are missing in .env.local"
        );
      }

      const client = new MossClient(
        MOSS_PROJECT_ID,
        MOSS_PROJECT_KEY
      );

      console.log("Loading Moss index...");

      await client.loadIndex(MOSS_INDEX_NAME);

      mossConnected = true;

      console.log(
        `Moss index loaded: ${MOSS_INDEX_NAME}`
      );

      // ======================================================
      // TRY REAL MOSS QUERY
      // ======================================================

      try {
        const results = await client.query(
          MOSS_INDEX_NAME,
          query,
          {
            topK: 5,
          }
        );

        const normalizedResults = Array.isArray(results)
          ? results
          : [results];

        evidence = normalizedResults
          .filter(Boolean)
          .map((item: any, index: number) => ({
            id:
              item?.id ||
              item?.document?.id ||
              `moss-${index + 1}`,

            text:
              item?.text ||
              item?.document?.text ||
              item?.content ||
              "",

            score:
              typeof item?.score === "number"
                ? item.score
                : typeof item?.similarity === "number"
                ? item.similarity
                : 0,

            metadata:
              item?.metadata ||
              item?.document?.metadata ||
              {},
          }))
          .filter((item: any) => item.text);

        if (evidence.length > 0) {
          mossQuerySuccessful = true;

          console.log(
            `Moss returned ${evidence.length} documents`
          );
        }
      } catch (error: any) {
        mossError =
          error?.message || String(error);

        console.warn(
          "Moss query failed:",
          mossError
        );
      }
    } catch (error: any) {
      mossError =
        error?.message || String(error);

      console.warn(
        "Moss loading failed:",
        mossError
      );
    }

    // ========================================================
    // IMPORTANT:
    // IF MOSS QUERY RETURNS 0 DOCUMENTS,
    // RETURN OUR TECHNICAL EVIDENCE INSTEAD OF EMPTY RESULTS.
    // ========================================================

    if (evidence.length === 0) {
      evidence = getFallbackEvidence(query);
    }

    // ========================================================
    // DIAGNOSIS
    // ========================================================

    const lowerQuery = query.toLowerCase();

    const hasE17 =
      lowerQuery.includes("e17");

    const hasOverheating =
      lowerQuery.includes("hot") ||
      lowerQuery.includes("heat") ||
      lowerQuery.includes("heating") ||
      lowerQuery.includes("overheating") ||
      lowerQuery.includes("temperature") ||
      lowerQuery.includes("over-temperature");

    const hasOverCurrent =
      lowerQuery.includes("e21") ||
      lowerQuery.includes("over-current") ||
      lowerQuery.includes("overcurrent");

    let diagnosis = "Motor Fault";
    let severity = "MEDIUM";
    let confidence = 85;

    if (hasE17 && hasOverheating) {
      diagnosis = "Motor Over-Temperature";
      severity = "HIGH";
      confidence = 92;
    } else if (hasOverCurrent) {
      diagnosis = "Motor Over-Current";
      severity = "HIGH";
      confidence = 90;
    } else if (hasOverheating) {
      diagnosis = "Motor Overheating";
      severity = "HIGH";
      confidence = 90;
    }

    // ========================================================
    // LIKELY CAUSES
    // ========================================================

    let likelyCauses = [
      "Insufficient cooling or blocked ventilation",
      "Excessive mechanical load",
      "High motor current",
      "Cooling fan failure",
      "High ambient temperature",
    ];

    if (hasOverCurrent && !hasOverheating) {
      likelyCauses = [
        "Excessive mechanical load",
        "Motor winding or insulation fault",
        "Incorrect controller settings",
        "Short circuit or electrical fault",
        "Motor current exceeding rated value",
      ];
    }

    // ========================================================
    // RECOMMENDED CHECKS
    // ========================================================

    let recommendedChecks = [
      "Check ventilation openings and remove blockage.",
      "Inspect the cooling fan and confirm it is operating.",
      "Measure motor current and compare it with the rated value.",
      "Check whether the connected mechanical load is excessive.",
      "Verify the surrounding ambient temperature.",
    ];

    if (hasOverCurrent && !hasOverheating) {
      recommendedChecks = [
        "Stop the motor and isolate power.",
        "Measure the motor current on all phases.",
        "Compare measured current with the motor rated current.",
        "Inspect the connected mechanical load.",
        "Check controller settings and motor wiring.",
      ];
    }

    // ========================================================
    // LATENCY
    // ========================================================

    const latency = Date.now() - startTime;

    // ========================================================
    // RETURN RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      query,

      diagnosis: {
        title: diagnosis,
        severity,
        confidence,
      },

      likelyCauses,

      recommendedChecks,

      safetyReminder:
        "Isolate power before opening the motor/controller enclosure. Allow the motor to cool before inspection.",

      evidence,

      retrieval: {
        mode: mossQuerySuccessful
          ? "moss-semantic"
          : "moss-index-loaded-local-evidence",

        latencyMs: latency,

        index: MOSS_INDEX_NAME,

        mossConnected,

        mossQuerySuccessful,

        mossError,
      },

      // ======================================================
      // FIELDS USED BY FIXFLOW UI
      // ======================================================

      mossConnected,

      mossQuerySuccessful,

      mossError,

      retrievalMode: mossQuerySuccessful
        ? "moss-semantic"
        : "local-evidence",

      retrievalLatency: latency,

      indexName: MOSS_INDEX_NAME,
    });
  } catch (error: any) {
    console.error(
      "FixFlow API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to process troubleshooting request.",
      },
      {
        status: 500,
      }
    );
  }
}