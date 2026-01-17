import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Root Cause Scoring App (System Refinement Protocol • Steps 4–5)
 * Canon scoring:
 *  - Ratings: N/S/V with values 0/1/2
 *  - Score = Likelihood × Impact × Controllability (0..8)
 *  - Color bands: 0 gray, 1 light gray, 2 amber, 4 green, 8 dark green
 *
 * Exports:
 *  - Copy to Roam (markdown table)
 *  - Download CSV
 *  - Download JSON
 */

type Rating = "N" | "S" | "V";

const RATING_VALUE: Record<Rating, number> = { N: 0, S: 1, V: 2 };

type Cause = {
  id: string;
  name: string;
  likelihood: Rating;
  impact: Rating;
  control: Rating;
  notes: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(s: string) {
  const needs = /[",\n]/.test(s);
  const v = s.replace(/"/g, '""');
  return needs ? `"${v}"` : v;
}


function scoreToBand(score: number) {
  // score ∈ {0,1,2,4,8}
  if (score >= 8) return { label: "Top", className: "bg-emerald-700 text-white" };
  if (score >= 4) return { label: "Strong", className: "bg-emerald-100 text-emerald-900" };
  if (score >= 2) return { label: "Plausible", className: "bg-amber-100 text-amber-900" };
  if (score >= 1) return { label: "Weak", className: "bg-zinc-100 text-zinc-800" };
  return { label: "Discard", className: "bg-zinc-200 text-zinc-800" };
}

function ratingChipClass(r: Rating, active: boolean) {
  const base = "rounded-xl px-3 py-1 text-sm font-medium border transition";
  if (!active) return `${base} bg-white text-zinc-700 hover:bg-zinc-50`;
  if (r === "V") return `${base} bg-emerald-100 text-emerald-900 border-emerald-200`;
  if (r === "S") return `${base} bg-amber-100 text-amber-900 border-amber-200`;
  return `${base} bg-zinc-200 text-zinc-800 border-zinc-300`;
}

export default function RootCauseScoringApp() {
  const [title, setTitle] = useState("Root Cause Evaluation");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [causes, setCauses] = useState<Cause[]>([
    {
      id: uid(),
      name: "Friction too high (too many steps/tools)",
      likelihood: "S",
      impact: "V",
      control: "V",
      notes: "",
    },
    {
      id: uid(),
      name: "Trigger missing (no reliable cue)",
      likelihood: "V",
      impact: "V",
      control: "V",
      notes: "",
    },
    {
      id: uid(),
      name: "Timing misaligned (wrong time/day/week)",
      likelihood: "S",
      impact: "S",
      control: "V",
      notes: "",
    },
  ]);

  const computed = useMemo(() => {
    const scored = causes.map((c) => {
      const L = RATING_VALUE[c.likelihood];
      const I = RATING_VALUE[c.impact];
      const C = RATING_VALUE[c.control];
      const score = L * I * C; // 0..8
      return { ...c, score, L, I, C };
    });

    const dir = sortDir === "desc" ? -1 : 1;
    scored.sort((a, b) => (a.score - b.score) * dir);
    return scored;
  }, [causes, sortDir]);

  const topPicks = useMemo(() => computed.slice(0, 3), [computed]);

  function updateCause(id: string, patch: Partial<Cause>) {
    setCauses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addCause() {
    setCauses((prev) => [
      ...prev,
      { id: uid(), name: "", likelihood: "S", impact: "S", control: "S", notes: "" },
    ]);
  }

  function removeCause(id: string) {
    setCauses((prev) => prev.filter((c) => c.id !== id));
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard.");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      alert("Copied to clipboard.");
    }
  }

  function exportRoam() {
  const header =
    "| Root Cause | Likelihood (N/S/V) | Impact (N/S/V) | Controllability (N/S/V) | Score | Notes |\n" +
    "|---|---:|---:|---:|---:|---|\n";

  const rows = computed
    .map(
      (c) =>
        `| ${c.name || "(unnamed)"} | ${c.likelihood} | ${c.impact} | ${c.control} | ${c.score} | ${c.notes || ""} |`
    )
    .join("\n");

  const meta =
    `# ${title}\n\n` +
    `- Scoring:: N=0, S=1, V=2\n` +
    `- Formula:: Score = Likelihood × Impact × Controllability\n\n`;

  copyToClipboard(meta + header + rows + "\n");
}


  function exportCSV() {
    const header = ["Root Cause", "Likelihood", "Impact", "Controllability", "Score", "Notes"];
    const lines = [header.join(",")];

    for (const c of computed) {
      lines.push(
        [
          escapeCsvCell(c.name || "(unnamed)"),
          c.likelihood,
          c.impact,
          c.control,
          String(c.score),
          escapeCsvCell(c.notes || ""),
        ].join(",")
      );
    }

    
  }

  function exportJSON() {
    const payload = {
      title,
      scoring: { N: 0, S: 1, V: 2, formula: "L*I*C" },
      causes: computed.map((c) => ({
        name: c.name,
        likelihood: c.likelihood,
        impact: c.impact,
        controllability: c.control,
        score: c.score,
        notes: c.notes,
      })),
    };

    downloadText("root-cause-evaluation.json", JSON.stringify(payload, null, 2));
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="text-sm text-zinc-600">System Refinement Protocol • Steps 4–5</div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
              Root Cause Scoring
            </h1>
            <p className="text-sm text-zinc-600">
              Rate candidates (N/S/V), surface the highest-leverage fixes, export to Roam.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={addCause} className="rounded-2xl">
              Add Cause
            </Button>
            <Button variant="outline" onClick={exportRoam} className="rounded-2xl">
              Copy to Roam
            </Button>
            <Button variant="outline" onClick={exportCSV} className="rounded-2xl">
              CSV
            </Button>
            <Button variant="outline" onClick={exportJSON} className="rounded-2xl">
              JSON
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="title">Evaluation Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Household Cleaning System"
                    className="rounded-2xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                >
                  Sort: Score ({sortDir === "desc" ? "High→Low" : "Low→High"})
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="rounded-2xl">
                      Legend
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Scoring Legend</DialogTitle>
                      <DialogDescription>
                        Canon for System Refinement Protocol steps 4–5.
                      </DialogDescription>
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
                      <div className="space-y-1">
                        <div className="font-medium">Bands</div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-xl text-xs font-medium ${scoreToBand(8).className}`}>
                            8 Top
                          </span>
                          <span className={`px-2 py-1 rounded-xl text-xs font-medium ${scoreToBand(4).className}`}>
                            4 Strong
                          </span>
                          <span className={`px-2 py-1 rounded-xl text-xs font-medium ${scoreToBand(2).className}`}>
                            2 Plausible
                          </span>
                          <span className={`px-2 py-1 rounded-xl text-xs font-medium ${scoreToBand(1).className}`}>
                            1 Weak
                          </span>
                          <span className={`px-2 py-1 rounded-xl text-xs font-medium ${scoreToBand(0).className}`}>
                            0 Discard
                          </span>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-3">
                <div className="rounded-2xl border bg-white overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-zinc-600 bg-zinc-50">
                    <div className="col-span-12 sm:col-span-5">Root Cause</div>
                    <div className="hidden sm:block sm:col-span-2 text-center">Likelihood</div>
                    <div className="hidden sm:block sm:col-span-2 text-center">Impact</div>
                    <div className="hidden sm:block sm:col-span-2 text-center">Control</div>
                    <div className="hidden sm:block sm:col-span-1 text-right">Score</div>
                  </div>

                  <div className="divide-y">
                    {computed.map((c, idx) => {
                      const band = scoreToBand(c.score);
                      return (
                        <div key={c.id} className="px-3 py-3">
                          <div className="grid grid-cols-12 gap-2 items-start">
                            <div className="col-span-12 sm:col-span-5 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs text-zinc-500">#{idx + 1}</div>
                                <Button
                                  variant="ghost"
                                  className="rounded-2xl"
                                  onClick={() => removeCause(c.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                              <Input
                                value={c.name}
                                onChange={(e) => updateCause(c.id, { name: e.target.value })}
                                placeholder="e.g., Trigger missing"
                                className="rounded-2xl"
                              />
                              <Input
                                value={c.notes}
                                onChange={(e) => updateCause(c.id, { notes: e.target.value })}
                                placeholder="Notes (optional)"
                                className="rounded-2xl"
                              />
                            </div>

                            {/* Mobile: stacked chips */}
                            <div className="col-span-12 sm:hidden grid grid-cols-1 gap-3 mt-2">
                              <RatingRow
                                label="Likelihood"
                                value={c.likelihood}
                                onChange={(v) => updateCause(c.id, { likelihood: v })}
                              />
                              <RatingRow
                                label="Impact"
                                value={c.impact}
                                onChange={(v) => updateCause(c.id, { impact: v })}
                              />
                              <RatingRow
                                label="Controllability"
                                value={c.control}
                                onChange={(v) => updateCause(c.id, { control: v })}
                              />
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-zinc-600">Score</div>
                                <div
                                  className={`px-2 py-1 rounded-xl text-sm font-medium ${band.className}`}
                                >
                                  {c.score} • {band.label}
                                </div>
                              </div>
                            </div>

                            {/* Desktop: chips */}
                            <div className="hidden sm:block sm:col-span-2">
                              <RatingChips
                                value={c.likelihood}
                                onChange={(v) => updateCause(c.id, { likelihood: v })}
                              />
                            </div>
                            <div className="hidden sm:block sm:col-span-2">
                              <RatingChips
                                value={c.impact}
                                onChange={(v) => updateCause(c.id, { impact: v })}
                              />
                            </div>
                            <div className="hidden sm:block sm:col-span-2">
                              <RatingChips
                                value={c.control}
                                onChange={(v) => updateCause(c.id, { control: v })}
                              />
                            </div>

                            <div className="hidden sm:flex sm:col-span-1 justify-end">
                              <div className={`px-2 py-1 rounded-xl text-sm font-medium ${band.className}`}>
                                {c.score}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <div className="text-sm text-zinc-600">
                    Tip: keep it to 5–10 candidates. Fix the top 1–2 first.
                  </div>
                  <div className="text-xs text-zinc-500">Scoring: N=0, S=1, V=2 • Score 0–8</div>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Candidates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topPicks.length === 0 ? (
                      <div className="text-sm text-zinc-600">Add causes to see rankings.</div>
                    ) : (
                      topPicks.map((c) => {
                        const band = scoreToBand(c.score);
                        return (
                          <div
                            key={c.id}
                            className="rounded-2xl border bg-white p-3 flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-zinc-900">
                                {c.name || "(unnamed)"}
                              </div>
                              <div className="text-xs text-zinc-600">
                                L {c.likelihood} • I {c.impact} • C {c.control}
                              </div>
                              {c.notes ? <div className="text-xs text-zinc-500">{c.notes}</div> : null}
                            </div>
                            <div
                              className={`shrink-0 px-2 py-1 rounded-xl text-sm font-medium ${band.className}`}
                            >
                              {c.score}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Export</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button onClick={exportRoam} className="w-full rounded-2xl">
                      Copy Roam Table
                    </Button>
                    <Button variant="outline" onClick={exportCSV} className="w-full rounded-2xl">
                      Download CSV
                    </Button>
                    <Button variant="outline" onClick={exportJSON} className="w-full rounded-2xl">
                      Download JSON
                    </Button>
                    <div className="text-xs text-zinc-500">
                      Roam export copies to clipboard as a markdown table.
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-700 space-y-2">
                    <div>
                      <span className="font-medium">Multiplicative scoring</span> suppresses causes
                      that are weak on any dimension.
                    </div>
                    <div>
                      When you see several 4s and 8s, you’re in a good spot: pick the simplest fix
                      among the top candidates.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-zinc-500 pb-6">Mobile-first N/S/V scoring for SRP Steps 4–5.</div>
      </div>
    </div>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Rating;
  onChange: (v: Rating) => void;
}) {
  return (
    <div className="rounded-2xl border bg-zinc-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-900">{label}</div>
        <div className="text-sm text-zinc-600">{value}</div>
      </div>
      <RatingChips value={value} onChange={onChange} />
    </div>
  );
}

function RatingChips({
  value,
  onChange,
}: {
  value: Rating;
  onChange: (v: Rating) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {(["N", "S", "V"] as Rating[]).map((r) => (
        <button
          key={r}
          type="button"
          className={ratingChipClass(r, value === r)}
          onClick={() => onChange(r)}
          aria-pressed={value === r}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
