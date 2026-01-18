import { useEffect, useMemo, useState } from "react";
import type { Rating, RootCause } from "./type";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const RATING_VALUE: Record<Rating, number> = { N: 0, S: 1, V: 2 };

function scoreRootCause(c: RootCause): number | null {
  const { likelihood, impact, controllability } = c.eval;
  if (!likelihood || !impact || !controllability) return null;
  return RATING_VALUE[likelihood] * RATING_VALUE[impact] * RATING_VALUE[controllability];
}

function isComplete(c: RootCause) {
  const e = c.eval;
  return !!e.likelihood && !!e.impact && !!e.controllability;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Props = {
  causes: RootCause[];
  setCauses: (next: RootCause[]) => void;
};

export default function RootCauseEvaluationPage({ causes, setCauses }: Props) {
  // Tracks whether user performed a sort while incomplete, so we can highlight null fields.
  const [sortedWhileIncomplete, setSortedWhileIncomplete] = useState(false);

  // Prompt when evaluation transitions to fully complete.
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [prevAllComplete, setPrevAllComplete] = useState(false);

  // Early-sort confirm dialog.
  const [showEarlySortConfirm, setShowEarlySortConfirm] = useState(false);

  // Add-on input (allowed on page 3)
  const [draft, setDraft] = useState("");

  const allComplete = useMemo(() => causes.length > 0 && causes.every(isComplete), [causes]);
  const anyIncomplete = useMemo(() => causes.some((c) => !isComplete(c)), [causes]);

  useEffect(() => {
    if (!prevAllComplete && allComplete) {
      setShowCompletionPrompt(true);
    }
    setPrevAllComplete(allComplete);
  }, [allComplete, prevAllComplete]);

  const rows = useMemo(() => {
    return causes.map((c, idx) => {
      const score = scoreRootCause(c);
      return { c, idx, score };
    });
  }, [causes]);

  function updateEval(id: string, patch: Partial<RootCause["eval"]>) {
    setCauses(
      causes.map((c) =>
        c.id === id ? { ...c, eval: { ...c.eval, ...patch } } : c
      )
    );
  }

  function addCauseHere() {
    const text = draft.trim();
    if (!text) return;
    setCauses([
      ...causes,
      { id: uid(), text, eval: { likelihood: null, impact: null, controllability: null } },
    ]);
    setDraft("");
  }

  function sortNow() {
    const completeOnTop = [...causes].sort((a, b) => {
      const aScore = scoreRootCause(a);
      const bScore = scoreRootCause(b);

      // Incomplete -> bottom, stable among themselves
      if (aScore === null && bScore === null) return 0;
      if (aScore === null) return 1;
      if (bScore === null) return -1;

      // Complete: descending high->low
      return bScore - aScore;
    });

    setCauses(completeOnTop);

    const stillIncomplete = completeOnTop.some((c) => !isComplete(c));
    setSortedWhileIncomplete(stillIncomplete);

    setShowCompletionPrompt(false);
    setShowEarlySortConfirm(false);
  }

  function onClickSort() {
    if (anyIncomplete) {
      setShowEarlySortConfirm(true);
      return;
    }
    sortNow();
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Root Cause Evaluation</CardTitle>
                <div className="text-sm text-zinc-600">
                  Assign ratings, then sort intentionally when you’re ready.
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="rounded-2xl">
                    Legend
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Scoring Legend</DialogTitle>
                    <DialogDescription>Canon for SRP steps 4–5.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm text-zinc-700">
                    <div className="space-y-1">
                      <div className="font-medium">Ratings</div>
                      <div>
                        <span className="font-medium">V</span> = Very Likely (2) •{" "}
                        <span className="font-medium">S</span> = Somewhat Likely (1) •{" "}
                        <span className="font-medium">N</span> = Not Likely (0)
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">Formula</div>
                      <div>Score = Likelihood × Impact × Controllability (0–8)</div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add another root cause…"
                className="rounded-2xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCauseHere();
                }}
              />
              <Button className="rounded-2xl" onClick={addCauseHere}>
                Add
              </Button>
            </div>

            <div className="rounded-2xl border bg-white overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-zinc-600 bg-zinc-50">
                <div className="col-span-12 sm:col-span-6">Root Cause</div>
                <div className="hidden sm:block sm:col-span-2 text-center">Likelihood</div>
                <div className="hidden sm:block sm:col-span-2 text-center">Impact</div>
                <div className="hidden sm:block sm:col-span-2 text-center">Control</div>
              </div>

              <div className="divide-y">
                {rows.map(({ c, idx, score }) => {
                  const needsAttention =
                    sortedWhileIncomplete &&
                    (!c.eval.likelihood || !c.eval.impact || !c.eval.controllability);

                  return (
                    <div key={c.id} className="px-3 py-3">
                      <div className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-12 sm:col-span-6 space-y-2">
                          <div className="text-xs text-zinc-500">#{idx + 1}</div>
                          <div className="text-sm text-zinc-900 whitespace-pre-wrap">{c.text}</div>
                          <div className="text-xs text-zinc-500">
                            Score: {score === null ? "–" : String(score)}
                          </div>
                          {needsAttention ? (
                            <div className="text-xs text-amber-700">
                              Missing ratings are highlighted.
                            </div>
                          ) : null}
                        </div>

                        <div className="hidden sm:block sm:col-span-2">
                          <RatingSelect
                            value={c.eval.likelihood}
                            onChange={(v) => updateEval(c.id, { likelihood: v })}
                            highlight={sortedWhileIncomplete && !c.eval.likelihood}
                          />
                        </div>

                        <div className="hidden sm:block sm:col-span-2">
                          <RatingSelect
                            value={c.eval.impact}
                            onChange={(v) => updateEval(c.id, { impact: v })}
                            highlight={sortedWhileIncomplete && !c.eval.impact}
                          />
                        </div>

                        <div className="hidden sm:block sm:col-span-2">
                          <RatingSelect
                            value={c.eval.controllability}
                            onChange={(v) => updateEval(c.id, { controllability: v })}
                            highlight={sortedWhileIncomplete && !c.eval.controllability}
                          />
                        </div>

                        {/* Mobile */}
                        <div className="col-span-12 sm:hidden grid grid-cols-1 gap-3 mt-2">
                          <MobileRow
                            label="Likelihood"
                            value={c.eval.likelihood}
                            onChange={(v) => updateEval(c.id, { likelihood: v })}
                            highlight={sortedWhileIncomplete && !c.eval.likelihood}
                          />
                          <MobileRow
                            label="Impact"
                            value={c.eval.impact}
                            onChange={(v) => updateEval(c.id, { impact: v })}
                            highlight={sortedWhileIncomplete && !c.eval.impact}
                          />
                          <MobileRow
                            label="Control"
                            value={c.eval.controllability}
                            onChange={(v) => updateEval(c.id, { controllability: v })}
                            highlight={sortedWhileIncomplete && !c.eval.controllability}
                          />
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-zinc-600">Score</div>
                            <div className="text-sm font-medium text-zinc-900">
                              {score === null ? "–" : score}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion prompt (shown once per completion event) */}
            <Dialog open={showCompletionPrompt} onOpenChange={setShowCompletionPrompt}>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Evaluation completed.</DialogTitle>
                  <DialogDescription>Would you like to sort your results?</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="rounded-2xl" onClick={() => setShowCompletionPrompt(false)}>
                    Go back
                  </Button>
                  <Button className="rounded-2xl" onClick={sortNow}>
                    Sort
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Early sort confirm */}
            <Dialog open={showEarlySortConfirm} onOpenChange={setShowEarlySortConfirm}>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Not all root causes have been evaluated.</DialogTitle>
                  <DialogDescription>Sort anyway?</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => setShowEarlySortConfirm(false)}
                  >
                    Go back
                  </Button>
                  <Button className="rounded-2xl" onClick={sortNow}>
                    Sort anyway
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex justify-end">
              <Button
                className={`rounded-2xl ${allComplete ? "" : "opacity-70"}`}
                onClick={onClickSort}
              >
                Sort
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RatingSelect({
  value,
  onChange,
  highlight,
}: {
  value: Rating | null;
  onChange: (v: Rating) => void;
  highlight: boolean;
}) {
  return (
    <div className="flex items-center justify-center">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value as Rating)}
        className={`h-9 w-16 rounded-md border px-2 text-sm bg-white text-center ${
          highlight ? "ring-2 ring-amber-300" : ""
        }`}
        aria-label="Rating"
      >
        <option value="" disabled>
          —
        </option>
        <option value="V">V</option>
        <option value="S">S</option>
        <option value="N">N</option>
      </select>
    </div>
  );
}

function MobileRow({
  label,
  value,
  onChange,
  highlight,
}: {
  label: string;
  value: Rating | null;
  onChange: (v: Rating) => void;
  highlight: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-zinc-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-900">{label}</div>
      </div>
      <RatingSelect value={value} onChange={onChange} highlight={highlight} />
    </div>
  );
}

