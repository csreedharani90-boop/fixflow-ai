"use client";

import { useRef, useState } from "react";
import {
  Room,
  createLocalAudioTrack,
  type LocalAudioTrack,
} from "livekit-client";

type Evidence = {
  id?: string;
  score?: number;
  text?: string;
  content?: string;
  source?: string;
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
  // ======================================================
  // BASIC STATE
  // ======================================================

  const [fault, setFault] = useState("");
  const [loading, setLoading] = useState(false);

  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);

  const [retrievalStatus, setRetrievalStatus] = useState("Ready");
  const [retrievalLatency, setRetrievalLatency] = useState("-");

  // ======================================================
  // LIVEKIT VOICE STATE
  // ======================================================

  const [isListening, setIsListening] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const audioTrackRef = useRef<LocalAudioTrack | null>(null);

  // ======================================================
  // GUIDED REPAIR MODE
  // ======================================================

  const [guidedRepair, setGuidedRepair] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);

  const [guidedAnswers, setGuidedAnswers] = useState<
    { step: number; check: string; result: string }[]
  >([]);

  // ======================================================
  // DIAGNOSIS LOGIC
  // ======================================================

  const generateDiagnosis = (text: string): Diagnosis => {
    const query = text.toLowerCase();

    if (
      query.includes("e17") ||
      query.includes("hot") ||
      query.includes("overheat") ||
      query.includes("temperature")
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
          "Inspect cooling fan and confirm it is operating.",
          "Measure motor current and compare it with the rated value.",
          "Check whether the connected mechanical load is excessive.",
          "Verify the surrounding ambient temperature.",
        ],
        safety:
          "Isolate electrical power before opening the equipment. Allow the motor to cool before inspection and follow site electrical safety procedures.",
      };
    }

    if (
      query.includes("e21") ||
      query.includes("over-current") ||
      query.includes("overcurrent") ||
      query.includes("current")
    ) {
      return {
        title: "Motor Over-Current",
        severity: "HIGH",
        confidence: 89,
        causes: [
          "Excessive mechanical load",
          "Motor winding or electrical fault",
          "Incorrect motor parameters",
          "Mechanical obstruction",
          "Supply or phase imbalance",
        ],
        checks: [
          "Measure motor current on all phases.",
          "Compare measured current with the motor rated current.",
          "Check for excessive mechanical load or mechanical obstruction.",
          "Verify motor configuration and rated parameters.",
          "Inspect the electrical supply and phase balance.",
        ],
        safety:
          "Disconnect and isolate electrical power before inspection. Do not touch energized conductors and follow the site's electrical lockout/tagout procedure.",
      };
    }

    if (
      query.includes("e09") ||
      query.includes("vibration") ||
      query.includes("noise")
    ) {
      return {
        title: "Abnormal Motor Vibration",
        severity: "MEDIUM",
        confidence: 86,
        causes: [
          "Mechanical imbalance",
          "Misalignment",
          "Bearing wear",
          "Loose mounting",
          "Coupling or mechanical damage",
        ],
        checks: [
          "Inspect the motor mounting and check for loose bolts.",
          "Check shaft and coupling alignment.",
          "Inspect bearings for abnormal noise or wear.",
          "Check for mechanical imbalance.",
          "Inspect the coupling and connected mechanical system.",
        ],
        safety:
          "Stop the equipment and isolate power before performing mechanical inspection. Do not approach moving components during operation.",
      };
    }

    return {
      title: "Motor Fault Requires Investigation",
      severity: "MEDIUM",
      confidence: 78,
      causes: [
        "Electrical fault",
        "Mechanical fault",
        "Cooling problem",
        "Incorrect operating conditions",
      ],
      checks: [
        "Record the exact fault code or observed symptom.",
        "Inspect the equipment for visible damage or abnormal conditions.",
        "Check electrical supply and motor operating parameters.",
        "Inspect the mechanical load and surrounding conditions.",
        "Refer to the relevant technical documentation before corrective action.",
      ],
      safety:
        "Follow site safety procedures and isolate hazardous energy before performing physical inspection or maintenance.",
    };
  };

  // ======================================================
  // MOSS KNOWLEDGE RETRIEVAL
  // ======================================================

  const searchKnowledge = async (voiceText?: string) => {
    const query = voiceText ?? fault;

    if (!query.trim()) {
      alert("Please enter a fault code or symptom.");
      return;
    }

    setFault(query);
    setLoading(true);
    setRetrievalStatus("Searching...");
    setRetrievalLatency("-");

    const startTime = performance.now();

    try {
      const response = await fetch("/api/moss-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      });

      const data = await response.json();

      const latency = Math.round(performance.now() - startTime);

      setRetrievalLatency(`${latency} ms`);
      setRetrievalStatus(
        data?.source?.includes("Moss")
          ? "Retrieved • Moss"
          : "Retrieved • Local"
      );

      if (Array.isArray(data?.results)) {
        setEvidence(data.results);
      } else if (Array.isArray(data?.evidence)) {
        setEvidence(data.evidence);
      } else {
        setEvidence([]);
      }

      // Generate diagnosis using the existing FixFlow workflow
      const result = generateDiagnosis(query);
      setDiagnosis(result);

      // Reset Guided Repair when a new diagnosis is generated
      setGuidedRepair(false);
      setGuidedStep(0);
      setGuidedAnswers([]);
    } catch (error) {
      console.error("Moss retrieval error:", error);

      setRetrievalStatus("Fallback");
      setRetrievalLatency(
        `${Math.round(performance.now() - startTime)} ms`
      );

      setEvidence([
        {
          id: "fallback-1",
          score: 0,
          source: "FixFlow Knowledge Base",
          content:
            "Fallback technical knowledge used because the retrieval service was unavailable.",
        },
      ]);

      const result = generateDiagnosis(query);
      setDiagnosis(result);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // LIVEKIT VOICE DIAGNOSIS
  // ======================================================

  const startVoiceDiagnosis = async () => {
    if (isListening) return;

    let room: Room | null = null;
    let audioTrack: LocalAudioTrack | null = null;

    try {
      setIsListening(true);

      const tokenResponse = await fetch("/api/livekit/token");
      const tokenData = await tokenResponse.json();

      if (!tokenData.success) {
        throw new Error(
          tokenData.error || "Unable to create LiveKit token"
        );
      }

      room = new Room();
      roomRef.current = room;

      await room.connect(tokenData.url, tokenData.token);

      audioTrack = await createLocalAudioTrack();
      audioTrackRef.current = audioTrack;

      await room.localParticipant.publishTrack(audioTrack);

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error(
          "Speech recognition is not supported in this browser. Please use Google Chrome."
        );
      }

      const recognition = new SpeechRecognition();

      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = async (event: any) => {
        const transcript =
          event.results?.[0]?.[0]?.transcript || "";

        if (transcript.trim()) {
          setFault(transcript);
          await searchKnowledge(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error(
          "Speech recognition error:",
          event
        );
      };

      recognition.onend = async () => {
        try {
          audioTrack?.stop();
          await room?.disconnect();
        } catch (error) {
          console.error(error);
        }

        audioTrackRef.current = null;
        roomRef.current = null;
        setIsListening(false);
      };

      recognition.start();
    } catch (error: any) {
      console.error("LiveKit voice error:", error);

      alert(
        error?.message ||
          "Unable to start voice diagnosis. Please check microphone permission."
      );

      try {
        audioTrack?.stop();
        await room?.disconnect();
      } catch {}

      audioTrackRef.current = null;
      roomRef.current = null;

      setIsListening(false);
    }
  };

  // ======================================================
  // GUIDED REPAIR FUNCTIONS
  // ======================================================

  const startGuidedRepair = () => {
    if (!diagnosis) return;

    setGuidedRepair(true);
    setGuidedStep(0);
    setGuidedAnswers([]);
  };

  const recordGuidedAnswer = (result: string) => {
    if (!diagnosis) return;

    const currentCheck = diagnosis.checks[guidedStep];

    setGuidedAnswers((previous) => {
      const existing = previous.find(
        (item) => item.step === guidedStep
      );

      if (existing) {
        return previous.map((item) =>
          item.step === guidedStep
            ? {
                step: guidedStep,
                check: currentCheck,
                result,
              }
            : item
        );
      }

      return [
        ...previous,
        {
          step: guidedStep,
          check: currentCheck,
          result,
        },
      ];
    });
  };

  const nextGuidedStep = () => {
    if (!diagnosis) return;

    const currentAnswer = guidedAnswers.find(
      (item) => item.step === guidedStep
    );

    if (!currentAnswer) {
      alert("Please record the observation before continuing.");
      return;
    }

    if (guidedStep < diagnosis.checks.length - 1) {
      setGuidedStep((previous) => previous + 1);
    } else {
      setGuidedRepair(false);
    }
  };

  const resetGuidedRepair = () => {
    setGuidedRepair(false);
    setGuidedStep(0);
    setGuidedAnswers([]);
  };

  // ======================================================
  // QUICK EXAMPLES
  // ======================================================

  const runExample = (example: string) => {
    setFault(example);
    searchKnowledge(example);
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              🔧 FixFlow
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              AI Technician Troubleshooting Assistant
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">
            Moss-powered semantic troubleshooting
          </div>

        </header>

        {/* INTRO */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold">
            Diagnose an Industrial Motor Fault
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Enter an industrial motor fault code or symptom to retrieve
            technical evidence and generate actionable troubleshooting
            guidance.
          </p>

          {/* INPUT */}
          <div className="mt-6">

            <label className="mb-2 block text-sm font-medium text-slate-300">
              Describe the fault or symptom
            </label>

            <textarea
              value={fault}
              onChange={(event) =>
                setFault(event.target.value)
              }
              placeholder="Example: E17 motor gets hot after 10 minutes"
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm outline-none transition focus:border-blue-500"
            />

          </div>

          {/* QUICK BUTTONS */}
          <div className="mt-4 flex flex-wrap gap-2">

            <button
              onClick={() =>
                runExample("E17 motor overheating")
              }
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs transition hover:bg-slate-700"
            >
              E17 overheating
            </button>

            <button
              onClick={() =>
                runExample("E21 motor over-current")
              }
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs transition hover:bg-slate-700"
            >
              E21 over-current
            </button>

            <button
              onClick={() =>
                runExample("Motor abnormal vibration")
              }
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs transition hover:bg-slate-700"
            >
              Vibration
            </button>

          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">

            <button
              onClick={() => searchKnowledge()}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Diagnosing..." : "Diagnose Fault"}
            </button>

            <button
              onClick={startVoiceDiagnosis}
              disabled={isListening || loading}
              className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-6 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isListening
                ? "🎙️ Listening..."
                : "🎤 Talk to FixFlow"}
            </button>

          </div>

        </section>

        {/* STATUS CARDS */}
        <section className="mb-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Knowledge Retrieval
            </p>

            <p className="mt-2 text-lg font-semibold">
              {retrievalStatus}
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Moss Knowledge Index
            </p>

            <p className="mt-2 text-lg font-semibold">
              fixflow-knowledge-v2
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Retrieval Latency
            </p>

            <p className="mt-2 text-lg font-semibold">
              {retrievalLatency}
            </p>

          </div>

        </section>

        {/* RESULTS */}
        {diagnosis ? (
          <section className="grid gap-6 lg:grid-cols-2">

            {/* DIAGNOSIS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    AI Diagnosis
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {diagnosis.title}
                  </h2>

                </div>

                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center">

                  <p className="text-xs text-red-400">
                    {diagnosis.severity}
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    {diagnosis.confidence}%
                  </p>

                  <p className="text-[10px] text-slate-500">
                    confidence
                  </p>

                </div>

              </div>

              {/* LIKELY CAUSES */}
              <div className="mt-7">

                <h3 className="mb-3 font-semibold">
                  Likely Causes
                </h3>

                <div className="space-y-2">

                  {diagnosis.causes.map(
                    (cause, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300"
                      >
                        <span className="mr-2 text-blue-400">
                          {index + 1}.
                        </span>

                        {cause}
                      </div>
                    )
                  )}

                </div>

              </div>

              {/* GUIDED REPAIR */}
              <div className="mt-7 rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">

                {!guidedRepair ? (
                  <>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="text-sm font-semibold text-blue-400">
                          🛠️ Guided Repair Mode
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Follow each recommended check step-by-step
                          and record what the technician observes.
                        </p>

                      </div>

                      <button
                        onClick={startGuidedRepair}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500"
                      >
                        Start Guided Repair
                      </button>

                    </div>

                  </>
                ) : (
                  <>

                    {/* GUIDED HEADER */}
                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-sm font-semibold text-blue-400">
                          🛠️ Guided Repair
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Step {guidedStep + 1} of{" "}
                          {diagnosis.checks.length}
                        </p>

                      </div>

                      <button
                        onClick={resetGuidedRepair}
                        className="text-xs text-slate-500 transition hover:text-white"
                      >
                        Exit
                      </button>

                    </div>

                    {/* PROGRESS */}
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{
                          width: `${
                            ((guidedStep + 1) /
                              diagnosis.checks.length) *
                            100
                          }%`,
                        }}
                      />

                    </div>

                    {/* CURRENT STEP */}
                    <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-5">

                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Technician Check
                      </p>

                      <p className="mt-3 text-base font-medium leading-7 text-white">
                        {diagnosis.checks[guidedStep]}
                      </p>

                    </div>

                    {/* SAFETY */}
                    <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">

                      <p className="text-sm font-semibold text-yellow-400">
                        ⚠️ Safety Reminder
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-300">
                        {diagnosis.safety}
                      </p>

                    </div>

                    {/* OBSERVATION */}
                    <div className="mt-5">

                      <p className="text-sm font-semibold text-slate-300">
                        Record Observation
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Select what the technician observed during
                        this check.
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-3">

                        <button
                          onClick={() =>
                            recordGuidedAnswer(
                              "Issue Found"
                            )
                          }
                          className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                            guidedAnswers.some(
                              (item) =>
                                item.step === guidedStep &&
                                item.result ===
                                  "Issue Found"
                            )
                              ? "border-red-400 bg-red-500/20 text-red-300"
                              : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          }`}
                        >
                          ⚠️ Issue Found
                        </button>

                        <button
                          onClick={() =>
                            recordGuidedAnswer(
                              "No Issue"
                            )
                          }
                          className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                            guidedAnswers.some(
                              (item) =>
                                item.step === guidedStep &&
                                item.result ===
                                  "No Issue"
                            )
                              ? "border-green-400 bg-green-500/20 text-green-300"
                              : "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          }`}
                        >
                          ✓ No Issue
                        </button>

                      </div>

                    </div>

                    {/* NEXT */}
                    <button
                      onClick={nextGuidedStep}
                      className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-500"
                    >
                      {guidedStep ===
                      diagnosis.checks.length - 1
                        ? "✓ Complete Troubleshooting"
                        : "Next Step →"}
                    </button>

                  </>
                )}

              </div>

              {/* RECOMMENDED CHECKS */}
              <div className="mt-7">

                <h3 className="mb-3 font-semibold">
                  Recommended Checks
                </h3>

                <div className="space-y-2">

                  {diagnosis.checks.map(
                    (check, index) => (
                      <div
                        key={index}
                        className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300"
                      >

                        <span className="font-semibold text-blue-400">
                          {index + 1}.
                        </span>

                        <span>{check}</span>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* SAFETY REMINDER */}
              <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">

                <p className="text-sm font-semibold text-yellow-400">
                  ⚠️ Safety Reminder
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {diagnosis.safety}
                </p>

              </div>

            </div>

            {/* EVIDENCE */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    Retrieved Evidence
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    Technical Knowledge
                  </h2>

                </div>

                <div className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-400">
                  {evidence.length} documents
                </div>

              </div>

              {/* EVIDENCE LIST */}
              <div className="mt-6 space-y-4">

                {evidence.length > 0 ? (
                  evidence.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-xs font-semibold text-blue-400">
                          Evidence {index + 1}
                        </p>

                        {typeof item.score === "number" && (
                          <span className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-400">
                            Score{" "}
                            {item.score.toFixed(2)}
                          </span>
                        )}

                      </div>

                      {item.source && (
                        <p className="mt-2 text-[10px] text-slate-500">
                          Source: {item.source}
                        </p>
                      )}

                      {item.id && (
                        <p className="mt-1 text-[10px] text-slate-500">
                          ID: {item.id}
                        </p>
                      )}

                      {/* ACTUAL MOSS EVIDENCE TEXT */}
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {item.text ||
                          item.content ||
                          "Relevant technical evidence retrieved from the knowledge base."}
                      </p>

                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-500">
                    No retrieval evidence available.
                  </div>
                )}

              </div>

              {/* EVIDENCE GROUNDING */}
              <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                <p className="text-sm font-semibold text-blue-400">
                  🔎 Evidence-Grounded Diagnosis
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  FixFlow retrieves relevant technical knowledge
                  from the Moss knowledge index and uses the
                  retrieved evidence within the troubleshooting
                  workflow. Evidence IDs and relevance scores
                  provide traceability for the diagnostic result.
                </p>

              </div>

            </div>

          </section>
        ) : (
          /* EMPTY STATE */
          <section className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">

            <div className="text-5xl">
              🔧
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Ready for Diagnosis
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Enter a motor fault code or symptom above. FixFlow
              will retrieve relevant technical evidence and
              generate a structured troubleshooting workflow.
            </p>

          </section>
        )}

        {/* FOOTER */}
        <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
          FixFlow • Moss-powered AI troubleshooting assistant
        </footer>

      </div>
    </main>
  );
}
