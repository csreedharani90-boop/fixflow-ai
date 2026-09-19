import { NextRequest, NextResponse } from "next/server";
import { MossClient } from "@moss-dev/moss";

export const runtime = "nodejs";

// ============================================================
// FIXFLOW MOSS CONFIGURATION
// ============================================================

const PROJECT_ID = process.env.MOSS_PROJECT_ID;
const PROJECT_KEY = process.env.MOSS_PROJECT_KEY;

// ============================================================
// FIXFLOW KNOWLEDGE BASE
// ============================================================

const fallbackKnowledge = [
  {
    id: "fx-001",
    text: "E17 indicates motor over-temperature. Possible causes include excessive load, insufficient cooling, blocked ventilation, high ambient temperature, bearing friction, or prolonged operation at high current.",
  },
  {
    id: "fx-002",
    text: "For motor overheating, first stop or reduce the motor load if safe. Check cooling fans, ventilation openings, ambient temperature, bearing condition, and motor current.",
  },
  {
    id: "fx-003",
    text: "Motor temperature above the recommended operating range can damage insulation and reduce motor lifetime. Do not continue operation when temperature reaches a critical level.",
  },
  {
    id: "fx-004",
    text: "If an industrial motor is overheating, verify whether the motor is overloaded. Compare measured current with the motor nameplate rated current.",
  },
  {
    id: "fx-005",
    text: "Blocked ventilation can cause motor temperature to rise because heat cannot be removed efficiently. Inspect air passages, cooling fins, and fan operation.",
  },
  {
    id: "fx-006",
    text: "High ambient temperature reduces the motor's ability to dissipate heat. Check surrounding temperature and improve ventilation or cooling if required.",
  },
  {
    id: "fx-007",
    text: "Bearing friction can increase motor temperature. Inspect bearings for abnormal noise, vibration, lubrication problems, or mechanical resistance.",
  },
  {
    id: "fx-008",
    text: "E21 indicates an over-current condition. Possible causes include motor overload, short circuit, mechanical blockage, incorrect configuration, or supply problems.",
  },
  {
    id: "fx-009",
    text: "For an E21 over-current fault, verify motor load and measured current before restarting the motor. Compare the current with the motor's rated current.",
  },
  {
    id: "fx-010",
    text: "Abnormal vibration can indicate bearing damage, shaft misalignment, rotor imbalance, loose mounting, mechanical resonance, or coupling problems.",
  },
  {
    id: "fx-011",
    text: "E09 is associated with abnormal vibration or mechanical noise. Inspect bearings, mounting bolts, shaft alignment, coupling, and rotor balance.",
  },
  {
    id: "fx-012",
    text: "Before inspecting industrial motor hardware, follow electrical safety procedures. Isolate power and apply appropriate lockout/tagout procedures when required.",
  },
  {
    id: "fx-013",
    text: "Motor troubleshooting should begin with the fault code, temperature, current, vibration, load condition, cooling condition, and recent operating changes.",
  },
  {
    id: "fx-014",
    text: "If motor temperature continues increasing despite reduced load and proper ventilation, stop operation and inspect the motor before further operation.",
  },
  {
    id: "fx-015",
    text: "A motor operating under excessive mechanical load can draw higher current and generate additional heat. Check the driven equipment for mechanical resistance.",
  },
  {
    id: "fx-016",
    text: "Loose electrical connections can cause abnormal heating. Inspect terminals and connections only after following proper electrical isolation procedures.",
  },
  {
    id: "fx-017",
    text: "Motor cooling fans should rotate freely and provide adequate airflow. A failed or obstructed fan can cause rapid temperature rise.",
  },
  {
    id: "fx-018",
    text: "If abnormal motor noise occurs together with overheating, bearing condition should be investigated because bearing friction can produce both heat and noise.",
  },
  {
    id: "fx-019",
    text: "If vibration increases suddenly, check mechanical alignment, mounting, coupling, bearings, and rotor balance before returning the motor to normal operation.",
  },
  {
    id: "fx-020",
    text: "Repeated motor overheating can indicate an underlying mechanical, electrical, environmental, or cooling problem and should not be solved only by repeatedly resetting the fault.",
  },

  // ============================================================
  // ADDITIONAL FIXFLOW KNOWLEDGE
  // ============================================================

  {
    id: "fx-021",
    text: "Normal motor troubleshooting sequence: identify the fault, verify sensor readings, inspect the physical condition, check electrical parameters, check mechanical load, apply corrective action, and verify safe operation.",
  },
  {
    id: "fx-022",
    text: "If temperature rises rapidly after starting the motor, investigate excessive current, mechanical load, cooling failure, bearing friction, or abnormal ambient conditions.",
  },
  {
    id: "fx-023",
    text: "A motor should not be restarted repeatedly after a thermal fault without identifying the cause. Repeated restarting can increase thermal stress.",
  },
  {
    id: "fx-024",
    text: "Motor current, temperature, vibration, and fault codes should be considered together because a single sensor value may not identify the root cause.",
  },
  {
    id: "fx-025",
    text: "For suspected overheating, compare the measured temperature against the motor manufacturer's specified operating limits rather than relying only on a generic temperature threshold.",
  },
  {
    id: "fx-026",
    text: "If a motor has adequate cooling but continues to overheat, investigate overload, incorrect voltage, phase imbalance, bearing friction, alignment problems, and internal motor faults.",
  },
  {
    id: "fx-027",
    text: "Phase imbalance in a three-phase motor can increase current and heating. Electrical measurements should be checked by qualified personnel using appropriate procedures.",
  },
  {
    id: "fx-028",
    text: "Motor vibration and temperature trends are useful for predictive maintenance. A gradual increase over time can indicate developing mechanical or thermal problems.",
  },
];

// ============================================================
// LOCAL FALLBACK DIAGNOSIS
// ============================================================

function getFallbackDiagnosis(query: string) {
  const q = query.toLowerCase();

  if (
    q.includes("e17") ||
    q.includes("overheat") ||
    q.includes("over temperature") ||
    q.includes("temperature")
  ) {
    return {
      title: "Motor Over-Temperature",
      severity: "HIGH",
      confidence: 92,
      causes: [
        "Excessive mechanical load",
        "Blocked ventilation",
        "Cooling fan failure",
        "High ambient temperature",
        "Bearing friction",
        "Prolonged high-current operation",
      ],
      checks: [
        "Check motor current against rated current",
        "Inspect cooling fan and ventilation",
        "Check ambient temperature",
        "Inspect bearings for friction/noise",
        "Check mechanical load",
      ],
      safety:
        "If temperature is in a critical range, stop the motor safely and follow the site's electrical isolation procedure before inspection.",
    };
  }

  if (
    q.includes("e21") ||
    q.includes("over current") ||
    q.includes("overcurrent") ||
    q.includes("high current")
  ) {
    return {
      title: "Motor Over-Current",
      severity: "HIGH",
      confidence: 89,
      causes: [
        "Motor overload",
        "Mechanical blockage",
        "Short circuit",
        "Incorrect configuration",
        "Supply or phase problem",
      ],
      checks: [
        "Measure motor current",
        "Compare current with nameplate rating",
        "Check mechanical load",
        "Inspect electrical connections",
        "Check supply conditions",
      ],
      safety:
        "Do not inspect energized electrical connections. Isolate power using the required safety procedure.",
    };
  }

  if (
    q.includes("e09") ||
    q.includes("vibration") ||
    q.includes("noise") ||
    q.includes("shaking")
  ) {
    return {
      title: "Abnormal Vibration",
      severity: "MEDIUM",
      confidence: 86,
      causes: [
        "Bearing damage",
        "Shaft misalignment",
        "Rotor imbalance",
        "Loose mounting",
        "Coupling problem",
      ],
      checks: [
        "Inspect bearings",
        "Check shaft alignment",
        "Inspect mounting bolts",
        "Check coupling",
        "Check vibration trend",
      ],
      safety:
        "Stop the equipment if vibration is severe or rapidly increasing and inspect only after following the required safety procedure.",
    };
  }

  return {
    title: "Motor Condition Requires Investigation",
    severity: "MEDIUM",
    confidence: 78,
    causes: [
      "Electrical abnormality",
      "Mechanical load problem",
      "Cooling problem",
      "Bearing or alignment issue",
    ],
    checks: [
      "Check fault code",
      "Check temperature",
      "Check current",
      "Check vibration",
      "Inspect cooling and mechanical load",
    ],
    safety:
      "Follow appropriate electrical and mechanical safety procedures before inspection.",
  };
}

// ============================================================
// MOSS CLIENT
// ============================================================

let mossClient: MossClient | null = null;

function getMossClient() {
  if (!PROJECT_ID || !PROJECT_KEY) {
    throw new Error(
      "MOSS_PROJECT_ID or MOSS_PROJECT_KEY is missing in .env.local"
    );
  }

  if (!mossClient) {
    mossClient = new MossClient(PROJECT_ID, PROJECT_KEY);
  }

  return mossClient;
}

// ============================================================
// SINGLE MOSS SESSION
// ============================================================

let mossSessionPromise: Promise<any> | null = null;

async function getMossSession() {
  if (!mossSessionPromise) {
    mossSessionPromise = (async () => {
      console.log("======================================");
      console.log("INITIALIZING FIXFLOW MOSS SESSION");
      console.log("======================================");

      const client = getMossClient();

      console.log("Creating fresh local Moss session...");

      const session = await client.session("fixflow-live");

      console.log(
        `Adding ${fallbackKnowledge.length} FixFlow knowledge documents...`
      );

      await session.addDocs(fallbackKnowledge);

      console.log("Moss local session ready");
      console.log("======================================");

      return session;
    })();
  }

  return mossSessionPromise;
}

// ============================================================
// POST /api/moss-search
// ============================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    const query =
      typeof body?.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "Query is required",
        },
        { status: 400 }
      );
    }

    console.log("");
    console.log("======================================");
    console.log("FIXFLOW MOSS LOCAL SEARCH");
    console.log("======================================");
    console.log("Query:", query);
    console.log("======================================");

    // --------------------------------------------------------
    // DIAGNOSIS
    // --------------------------------------------------------

    const diagnosis = getFallbackDiagnosis(query);

    // --------------------------------------------------------
    // MOSS SEARCH
    // --------------------------------------------------------

    let evidence: Array<{
      id: string;
      score: number;
      text: string;
    }> = [];

    let source = "Local Knowledge";

    try {
      const session = await getMossSession();

      console.log("Querying Moss...");

      const mossResults = await session.query(query);

      console.log("Moss query completed");

      // Normalize Moss result format safely
      if (Array.isArray(mossResults)) {
        evidence = mossResults.slice(0, 5).map((item: any, index: number) => ({
          id:
            item?.id ??
            item?.document?.id ??
            `moss-${index + 1}`,
          score:
            typeof item?.score === "number"
              ? item.score
              : typeof item?.similarity === "number"
                ? item.similarity
                : 0,
          text:
            item?.text ??
            item?.document?.text ??
            item?.content ??
            "",
        }));
      } else if (Array.isArray(mossResults?.results)) {
        evidence = mossResults.results
          .slice(0, 5)
          .map((item: any, index: number) => ({
            id:
              item?.id ??
              item?.document?.id ??
              `moss-${index + 1}`,
            score:
              typeof item?.score === "number"
                ? item.score
                : typeof item?.similarity === "number"
                  ? item.similarity
                  : 0,
            text:
              item?.text ??
              item?.document?.text ??
              item?.content ??
              "",
          }));
      } else if (Array.isArray(mossResults?.docs)) {
        evidence = mossResults.docs
          .slice(0, 5)
          .map((item: any, index: number) => ({
            id:
              item?.id ??
              item?.document?.id ??
              `moss-${index + 1}`,
            score:
              typeof item?.score === "number"
                ? item.score
                : typeof item?.similarity === "number"
                  ? item.similarity
                  : 0,
            text:
              item?.text ??
              item?.document?.text ??
              item?.content ??
              "",
          }));
      }

      evidence = evidence.filter((item) => item.text);

      if (evidence.length > 0) {
        source = "Live • Moss Local";
      }

      console.log("Moss evidence count:", evidence.length);
    } catch (mossError) {
      console.error("======================================");
      console.error("MOSS SEARCH FAILED");
      console.error(mossError);
      console.error("Using local FixFlow knowledge fallback");
      console.error("======================================");

      // ------------------------------------------------------
      // LOCAL FALLBACK
      // ------------------------------------------------------

      const q = query.toLowerCase();

      let matchingDocs = fallbackKnowledge;

      if (
        q.includes("e17") ||
        q.includes("overheat") ||
        q.includes("temperature")
      ) {
        matchingDocs = fallbackKnowledge.filter(
          (doc) =>
            doc.text.toLowerCase().includes("temperature") ||
            doc.text.toLowerCase().includes("overheat") ||
            doc.text.toLowerCase().includes("cooling") ||
            doc.text.toLowerCase().includes("load")
        );
      } else if (
        q.includes("e21") ||
        q.includes("overcurrent") ||
        q.includes("over current") ||
        q.includes("current")
      ) {
        matchingDocs = fallbackKnowledge.filter(
          (doc) =>
            doc.text.toLowerCase().includes("current") ||
            doc.text.toLowerCase().includes("overload") ||
            doc.text.toLowerCase().includes("load")
        );
      } else if (
        q.includes("e09") ||
        q.includes("vibration") ||
        q.includes("noise")
      ) {
        matchingDocs = fallbackKnowledge.filter(
          (doc) =>
            doc.text.toLowerCase().includes("vibration") ||
            doc.text.toLowerCase().includes("bearing") ||
            doc.text.toLowerCase().includes("alignment") ||
            doc.text.toLowerCase().includes("noise")
        );
      }

      evidence = matchingDocs.slice(0, 5).map((doc, index) => ({
        id: doc.id,
        score: Math.max(0.95 - index * 0.05, 0.5),
        text: doc.text,
      }));
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    const latency = Date.now() - startTime;

    console.log("======================================");
    console.log("FIXFLOW SEARCH COMPLETE");
    console.log("Source:", source);
    console.log("Evidence:", evidence.length);
    console.log("Latency:", `${latency} ms`);
    console.log("======================================");

    return NextResponse.json({
      success: true,

      query,

      diagnosis,

      evidence,

      source,

      latency,

      moss: {
        enabled: true,
        mode: "local-session",
        status:
          source === "Live • Moss Local"
            ? "connected"
            : "fallback",
      },
    });
  } catch (error) {
    console.error("FixFlow Moss API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}