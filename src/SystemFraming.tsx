import { useMemo, useState } from "react";
import type { SystemFraming } from "./type";

type Props = {
  initial?: SystemFraming | null;
  onSubmit: (framing: SystemFraming) => void;
};

export function SystemFramingScreen({ initial, onSubmit }: Props) {
  const [systemName, setSystemName] = useState(initial?.systemName ?? "");
  const [optimalOutcome, setOptimalOutcome] = useState(
    initial?.optimalOutcome ?? ""
  );
  const [insufficientRaw, setInsufficientRaw] = useState(
    (initial?.insufficientOutcomes ?? []).join("\n")
  );

  const insufficientOutcomes = useMemo(() => {
    return insufficientRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [insufficientRaw]);

  const canContinue =
    systemName.trim().length > 0 &&
    optimalOutcome.trim().length > 0 &&
    insufficientOutcomes.length > 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>System Framing</h1>

      <section
        style={{
          margin: "18px 0 24px",
          padding: 16,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 10,
        }}
      >
        <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>
          1. System Under Refinement
        </h2>
        <div style={{ opacity: 0.8, marginBottom: 8 }}>
          What system is being examined?
        </div>
        <ul style={{ margin: "0 0 12px 18px", opacity: 0.85 }}>
          <li>One sentence.</li>
          <li>Noun-based, not emotional.</li>
          <li>Must describe an existing system, not a desire.</li>
        </ul>
        <textarea
          value={systemName}
          onChange={(e) => setSystemName(e.target.value)}
          placeholder='e.g., "Evening transition from work → rest"'
          rows={3}
          style={{
            width: "100%",
            fontSize: 14,
            padding: 10,
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.18)",
          }}
        />
      </section>

      <section
        style={{
          margin: "18px 0 24px",
          padding: 16,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 10,
        }}
      >
        <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>
          2. Optimal Outcome (if system were working)
        </h2>
        <div style={{ opacity: 0.8, marginBottom: 8 }}>
          What would this system reliably produce if functioning well?
        </div>
        <ul style={{ margin: "0 0 12px 18px", opacity: 0.85 }}>
          <li>Observable outcomes, not vibes.</li>
          <li>Time-bounded and/or repeatable.</li>
          <li>No mention of how.</li>
        </ul>
        <textarea
          value={optimalOutcome}
          onChange={(e) => setOptimalOutcome(e.target.value)}
          placeholder='e.g., "Asleep by 10:30 PM without friction 5+ nights/week"'
          rows={3}
          style={{
            width: "100%",
            fontSize: 14,
            padding: 10,
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.18)",
          }}
        />
      </section>

      <section
        style={{
          margin: "18px 0 24px",
          padding: 16,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 10,
        }}
      >
        <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>
          3. Current Insufficient Outcomes
        </h2>
        <div style={{ opacity: 0.8, marginBottom: 8 }}>
          What is happening instead that signals the system is failing?
        </div>
        <ul style={{ margin: "0 0 12px 18px", opacity: 0.85 }}>
          <li>Concrete symptoms — do not explain.</li>
          <li>Patterns, not one-offs.</li>
          <li>Ideally 2–4 bullets max.</li>
        </ul>
        <textarea
          value={insufficientRaw}
          onChange={(e) => setInsufficientRaw(e.target.value)}
          placeholder={
            "One per line:\n- Decision drift after dinner\n- Screen time extends late"
          }
          rows={5}
          style={{
            width: "100%",
            fontSize: 14,
            padding: 10,
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.18)",
          }}
        />
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          disabled={!canContinue}
          onClick={() =>
            onSubmit({
              systemName: systemName.trim(),
              optimalOutcome: optimalOutcome.trim(),
              insufficientOutcomes,
            })
          }
          style={{
            padding: "12px 14px",
            fontSize: 14,
            borderRadius: 10,
            border: "none",
            cursor: canContinue ? "pointer" : "not-allowed",
            opacity: canContinue ? 1 : 0.5,
          }}
        >
          Begin Root Cause Analysis →
        </button>

        {!canContinue && (
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            Fill in all three sections (and at least 1 insufficient outcome) to
            continue.
          </div>
        )}
      </div>
    </div>
  );
}
