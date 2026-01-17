import { useState } from "react";
import RootCauseScoringApp from "./RootCauseScoringApp";

import type { SystemFraming } from "./type";
import { SystemFramingScreen } from "./SystemFraming";
import { SystemFramingSummary } from "./SystemFramingSummary";

type Step = "framing" | "rca";

export default function App() {
  const [step, setStep] = useState<Step>("framing");
  const [framing, setFraming] = useState<SystemFraming | null>(null);

  if (step === "framing") {
    return (
      <SystemFramingScreen
        initial={framing}
        onSubmit={(f) => {
          setFraming(f);
          setStep("rca");
        }}
      />
    );
  }

  // Safety guard — should never happen, but prevents undefined access
  if (!framing) {
    return (
      <SystemFramingScreen
        initial={null}
        onSubmit={(f) => {
          setFraming(f);
          setStep("rca");
        }}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <SystemFramingSummary
        framing={framing}
        onEdit={() => setStep("framing")}
      />

      <RootCauseScoringApp />
    </div>
  );
}
