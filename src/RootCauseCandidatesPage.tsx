import { useMemo, useRef, useState } from "react";
import type { RootCause } from "./type";
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

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Props = {
  causes: RootCause[];
  setCauses: (next: RootCause[]) => void;
  onContinue: () => void;
};

export default function RootCauseCandidatesPage({ causes, setCauses, onContinue }: Props) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canContinue = causes.length >= 1;

  const numbered = useMemo(
    () => causes.map((c, i) => ({ ...c, n: i + 1 })),
    [causes]
  );

  function addCause() {
    const text = draft.trim();
    if (!text) return;

    const next: RootCause = {
      id: uid(),
      text,
      eval: { likelihood: null, impact: null, controllability: null },
    };

    setCauses([...causes, next]);
    setDraft("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function beginEdit(id: string) {
    const item = causes.find((c) => c.id === id);
    if (!item) return;
    setEditingId(id);
    setEditDraft(item.text);
  }

  function commitEdit(id: string) {
    const text = editDraft.trim();
    if (!text) return; // keep it simple: don't allow empty names
    setCauses(causes.map((c) => (c.id === id ? { ...c, text } : c)));
    setEditingId(null);
    setEditDraft("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  function removeCause(id: string) {
    setCauses(causes.filter((c) => c.id !== id));
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50">
      <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Root Cause Candidates</CardTitle>
            <div className="text-sm text-zinc-600">
              Divergent thinking only. List possible root causes without evaluating.
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a root cause…"
                className="rounded-2xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCause();
                }}
              />
              <Button className="rounded-2xl" onClick={addCause}>
                Add
              </Button>
            </div>

            <div className="rounded-2xl border bg-white overflow-hidden">
              <div className="px-4 py-3 text-sm font-medium text-zinc-700 bg-zinc-50">
                Candidates
              </div>

              <ol className="divide-y">
                {numbered.map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-6 text-xs text-zinc-500">{c.n}.</div>

                      <div className="flex-1">
                        {editingId === c.id ? (
                          <Input
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            className="rounded-2xl"
                            autoFocus
                            onBlur={() => commitEdit(c.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit(c.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                          />
                        ) : (
                          <div className="text-sm text-zinc-900 whitespace-pre-wrap">
                            {c.text}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          className="rounded-2xl"
                          onClick={() => beginEdit(c.id)}
                        >
                          ✏️
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" className="rounded-2xl">
                              🗑️
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>Trash this root cause?</DialogTitle>
                              <DialogDescription>
                                This will remove it from the list.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" className="rounded-2xl">
                                Cancel
                              </Button>
                              <Button
                                className="rounded-2xl"
                                onClick={() => removeCause(c.id)}
                              >
                                Trash
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </li>
                ))}

                {causes.length === 0 ? (
                  <li className="px-4 py-6 text-sm text-zinc-600">
                    Add at least one root cause to continue.
                  </li>
                ) : null}
              </ol>
            </div>

            <div className="flex justify-end">
              <Button
                className="rounded-2xl"
                disabled={!canContinue}
                onClick={onContinue}
              >
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
