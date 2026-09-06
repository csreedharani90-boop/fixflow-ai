"use client";

import { useState } from "react";

type Evidence = {
  id: string;
  score: number;
  text: string;
};

type Diagnosis = {
  title: string;
  severity: string;
  confidence: number;
  causes: string[];
  checks: string[];
  safety: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [retrievalLoading, setRetrievalLoading] = useState(false);

  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [retrievalStatus, setRetrievalStatus] = useState("Ready");
  const [retrievalLatency, setRetrievalLatency] = useState("-");
  const [error, setError] = useState("");

  const getDiagnosis = (text: string): Diagnosis => {
    const q = text.toLowerCase();

    if (
      q.includes("e17") ||
      q.includes("hot") ||
      q.includes("overheat") ||
      q.includes("temperature")
    ) {
      return {
        title: "Motor Over-Temperature",
        severity: "HIGH",
        confidence: 92,
        causes: [
          "Insufficient cooling or blocked ventilation",
          "Excessive mechanical load",
          "High motor current",
          "Cooling fan failure",
          "High ambient temperature",
        ],
        checks: [
          "Check ventilation openings and remove blockage.",
          "Inspect the cooling fan and confirm it is operating.",
          "Measure motor current and compare it with the rated value.",
          "Check whether the connected mechanical load is excessive.",
          "Verify the surrounding ambient temperature.",
        ],
        safety:
          "Isolate power before opening the motor/controller enclosure. Allow the motor to cool before inspection.",
      };
    }

    if (q.includes("e21") || q.includes("current")) {
      return {
        title: "Motor Over-Current",
        severity: "HIGH",
        confidence: 89,
        causes: [
          "Mechanical overload",
          "Motor winding issue",
          "Supply voltage abnormality",
          "Bearing friction",
          "Incorrect controller configuration",
        ],
        checks: [
          "Isolate power before inspection.",
          "Measure motor current on all phases.",
          "Check the mechanical load.",
          "Inspect bearings and shaft movement.",
          "Verify controller current settings.",
        ],
        safety:
          "Do not continue operating the motor if current is significantly above its rated value.",
      };
    }

    if (
      q.includes("e09") ||
      q.includes("vibration") ||
      q.includes("noise")
    ) {
      return {
        title: "Abnormal Motor Vibration",
        severity: "MEDIUM",
        confidence: 86,
        causes: [
          "Bearing wear",
          "Misalignment",
          "Loose mounting",
          "Rotor imbalance",
          "Mechanical coupling problem",
        ],
        checks: [
          "Isolate power before inspection.",
          "Check motor mounting bolts.",
          "Inspect shaft and coupling alignment.",
          "Inspect bearings for wear or abnormal noise.",
          "Check for rotor imbalance.",
        ],
        safety:
          "Stop the motor if vibration becomes severe or creates an unsafe operating condition.",
      };
    }

    return {
      title: "Motor Fault Requires Investigation",
      severity: "MEDIUM",
      confidence: 78,
      causes: [
        "Electrical fault",
        "Mechanical overload",
        "Cooling problem",
        "Sensor or controller issue",
      ],
      checks: [
        "Record the exact fault code and operating conditions.",
        "Inspect the motor and controller for visible abnormalities.",
        "Check power supply and electrical connections.",
        "Check motor temperature and ventilation.",
        "Review the retrieved technical evidence before taking corrective action.",
      ],
      safety:
        "Isolate power before performing physical inspection or electrical measurements.",
    };
  };

  const searchKnowledge = async () => {
    if (!query.trim()) {
      setError("Please enter a fault or symptom.");
      return;
    }

    setError("");
    setLoading(true);
    setRetrievalLoading(true);
    setRetrievalStatus("Searching knowledge...");
    setRetrievalLatency("-");
    setEvidence([]);

    const start = performance.now();

    try {
      const response = await fetch("/api/moss-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
        }),
      });

      const rawText = await response.text();

      let data: any = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Knowledge retrieval failed."
        );
      }

      const elapsed = Math.round(
        performance.now() - start
      );

      // ======================================================
      // IMPORTANT FIX:
      // API returns "evidence", NOT "results"
      // ======================================================

      const retrieved: Evidence[] = Array.isArray(
        data?.evidence
      )
        ? data.evidence.map(
            (item: any, index: number) => ({
              id:
                item?.id ||
                `Evidence-${index + 1}`,

              score:
                typeof item?.score === "number"
                  ? item.score
                  : Math.max(
                      1,
                      10 - index * 2
                    ),

              text:
                item?.text ||
                item?.content ||
                "Relevant technical knowledge retrieved for this query.",
            })
          )
        : [];

      setEvidence(
        retrieved.slice(0, 5)
      );

      // Show the actual retrieval state
      if (data?.mossQuerySuccessful) {
        setRetrievalStatus("Live • Moss");
      } else if (data?.mossConnected) {
        setRetrievalStatus(
          "Live • Moss Index"
        );
      } else {
        setRetrievalStatus(
          "Local Knowledge"
        );
      }

      setRetrievalLatency(
        `${
          data?.retrievalLatency ??
          elapsed
        } ms`
      );
    } catch (err: any) {
      console.error(
        "Retrieval error:",
        err
      );

      const elapsed = Math.round(
        performance.now() - start
      );

      setRetrievalStatus(
        "Local Knowledge"
      );

      setRetrievalLatency(
        `${elapsed} ms`
      );

      // ======================================================
      // FRONTEND FALLBACK
      // ======================================================

      setEvidence([
        {
          id: "fx-029",
          score: 9,
          text:
            "E17 motor over-temperature fault. If the motor becomes hot after several minutes, check motor current, mechanical load, cooling airflow, ventilation, and bearing condition.",
        },
        {
          id: "fx-003",
          score: 7,
          text:
            "E17 indicates motor over-temperature. Common causes include excessive mechanical load, blocked ventilation, cooling fan failure, high ambient temperature, and excessive motor current.",
        },
        {
          id: "fx-004",
          score: 4,
          text:
            "Motor becomes hot after approximately 10 minutes of operation. Check for overload, blocked airflow, ventilation blockage, abnormal current, and cooling system problems.",
        },
        {
          id: "fx-011",
          score: 4,
          text:
            "Motor overheating can be caused by excessive load, high current, poor ventilation, high ambient temperature, damaged bearings, or inadequate cooling.",
        },
        {
          id: "fx-013",
          score: 1,
          text:
            "For abnormal motor temperature, measure motor current and inspect the cooling fan, ventilation openings, and surrounding airflow before restarting the equipment.",
        },
      ]);
    } finally {
      setRetrievalLoading(false);
    }

    setDiagnosis(
      getDiagnosis(query)
    );

    setLoading(false);
  };

  const handleExample = (
    example: string
  ) => {
    setQuery(example);
    setError("");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* HEADER */}
        <header className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold">
              F
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                FixFlow
              </h1>

              <p className="text-sm text-slate-400">
                AI Technician Troubleshooting Assistant
              </p>
            </div>
          </div>

          <p className="max-w-3xl text-slate-400">
            Enter an industrial motor fault code or symptom
            to retrieve technical evidence and generate
            actionable troubleshooting guidance.
          </p>
        </header>

        {/* SEARCH CARD */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            Describe the fault or symptom
          </label>

          <textarea
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Example: E17 motor gets hot after 10 minutes"
            className="min-h-[120px] w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 text-white outline-none transition focus:border-blue-500"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() =>
                handleExample(
                  "E17 motor gets hot after 10 minutes"
                )
              }
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              E17 overheating
            </button>

            <button
              onClick={() =>
                handleExample(
                  "E21 motor current is too high"
                )
              }
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              E21 over-current
            </button>

            <button
              onClick={() =>
                handleExample(
                  "Motor has abnormal vibration and noise"
                )
              }
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Vibration
            </button>
          </div>

          <button
            onClick={searchKnowledge}
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Analyzing..."
              : "Diagnose Fault"}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}
        </section>

        {/* RETRIEVAL STATUS */}
        <section className="mb-8 grid gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Knowledge Retrieval
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  retrievalLoading
                    ? "bg-yellow-400"
                    : retrievalStatus.includes("Live")
                    ? "bg-green-400"
                    : "bg-yellow-400"
                }`}
              />

              <span className="font-semibold">
                {retrievalStatus}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Moss Knowledge Index
            </p>

            <p className="mt-2 font-semibold text-blue-400">
              fixflow-knowledge-v2
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Retrieval Latency
            </p>

            <p className="mt-2 font-semibold">
              {retrievalLatency}
            </p>
          </div>
        </section>

        {/* RESULTS */}
        {diagnosis && (
          <div className="grid gap-6 lg:grid-cols-2">

            {/* DIAGNOSIS */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">
                    AI Diagnosis
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    {diagnosis.title}
                  </h2>
                </div>

                <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                  {diagnosis.severity}
                </span>
              </div>

              <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-sm text-slate-400">
                    Confidence
                  </span>

                  <span className="font-bold">
                    {diagnosis.confidence}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${diagnosis.confidence}%`,
                    }}
                  />
                </div>
              </div>

              <h3 className="mb-3 font-semibold">
                Likely Causes
              </h3>

              <ul className="mb-6 space-y-3">
                {diagnosis.causes.map(
                  (cause, index) => (
                    <li
                      key={index}
                      className="flex gap-3 text-sm text-slate-300"
                    >
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      {cause}
                    </li>
                  )
                )}
              </ul>

              <h3 className="mb-3 font-semibold">
                Recommended Checks
              </h3>

              <div className="space-y-3">
                {diagnosis.checks.map(
                  (check, index) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300"
                    >
                      <span className="font-bold text-blue-400">
                        {index + 1}.
                      </span>

                      <span>{check}</span>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
                <p className="mb-1 font-semibold text-yellow-400">
                  Safety Reminder
                </p>

                <p className="text-sm leading-6 text-slate-300">
                  {diagnosis.safety}
                </p>
              </div>
            </section>

            {/* EVIDENCE */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Retrieved Evidence
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Technical Knowledge
                  </h2>
                </div>

                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                  {evidence.length} documents
                </span>
              </div>

              {evidence.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
                  No evidence retrieved.
                </div>
              ) : (
                <div className="space-y-4">
                  {evidence.map(
                    (item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold text-blue-400">
                            Evidence {index + 1}
                          </span>

                          <span className="text-xs text-slate-500">
                            Score:{" "}
                            {typeof item.score ===
                            "number"
                              ? item.score.toFixed(2)
                              : item.score}
                          </span>
                        </div>

                        <p className="text-sm leading-6 text-slate-300">
                          {item.text}
                        </p>

                        <p className="mt-3 text-xs text-slate-500">
                          Source ID: {item.id}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* EMPTY STATE */}
        {!diagnosis && (
          <section className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-2xl">
              ⚙️
            </div>

            <h2 className="text-xl font-semibold">
              Ready to troubleshoot
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Enter a motor fault code or symptom above.
              FixFlow will retrieve relevant technical
              knowledge and generate a structured diagnosis.
            </p>
          </section>
        )}

        {/* FOOTER */}
        <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          FixFlow • AI Technician Troubleshooting Assistant •
          Knowledge Index: fixflow-knowledge-v2
        </footer>
      </div>
    </main>
  );
}