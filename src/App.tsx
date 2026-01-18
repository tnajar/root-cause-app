import { useState } from "react";
import type { RootCause, SystemFraming } from "./type";
import { SystemFramingScreen } from "./SystemFraming";
import { SystemFramingSummary } from "./SystemFramingSummary";
import RootCauseCandidatesPage from "./RootCauseCandidatesPage";
import RootCauseEvaluationPage from "./RootCauseEvaluationPage";

type Step = "framing" | "candidates" | "evaluation";

export default function App() {
  const [step, setStep] = useState<Step>("framing");
  const [framing, setFraming] = useState<SystemFraming | null>(null);
  const [causes, setCauses] = useState<RootCause[]>([]);

  if (step === "framing") {
    return (
      <SystemFramingScreen
        initial={framing}
        onSubmit={(f) => {
          setFraming(f);
          setStep("candidates");
        }}
      />
    );
  }

  if (step === "candidates") {
    return (
      <div>
        <div className="mx-auto max-w-5xl p-4 sm:p-6">
          {framing ? <SystemFramingSummary framing={framing} onEdit={() => setStep("framing")} /> : null}
        </div>
        <RootCauseCandidatesPage
          causes={causes}
          setCauses={setCauses}
          onContinue={() => setStep("evaluation")}
        />
      </div>
    );
  }

  // evaluation
  return (
    <div>
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        {framing ? <SystemFramingSummary framing={framing} onEdit={() => setStep("framing")} /> : null}
      </div>
      <RootCauseEvaluationPage causes={causes} setCauses={setCauses} />
    </div>
  );
}
