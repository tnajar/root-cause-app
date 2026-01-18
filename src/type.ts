export type SystemFraming = {
  systemName: string;
  optimalOutcome: string;
  insufficientOutcomes: string[];
};

export type Rating = "V" | "S" | "N";

export type EvalTriple = {
  likelihood: Rating | null;
  impact: Rating | null;
  controllability: Rating | null;
};

export type RootCause = {
  id: string;
  text: string;
  eval: EvalTriple;
};
