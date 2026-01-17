import { useState } from "react";
import type { SystemFraming } from "./type";

type Props = {
  framing: SystemFraming;
  onEdit: () => void;
};

export function SystemFramingSummary({ framing, onEdit }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            padding: "6px 8px",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: 14,
          }}
        >
          {open ? "Hide framing" : "Show framing"}
        </button>

        <button
          onClick={onEdit}
          style={{
            background: "none",
            border: "none",
            padding: "6px 8px",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: 14,
          }}
        >
          Edit
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
            <div style={{ opacity: 0.7, fontSize: 13 }}>System</div>
            <div style={{ fontSize: 14 }}>{framing.systemName}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
            <div style={{ opacity: 0.7, fontSize: 13 }}>Optimal output</div>
            <div style={{ fontSize: 14 }}>{framing.optimalOutcome}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
            <div style={{ opacity: 0.7, fontSize: 13 }}>Current failures</div>
            <div style={{ fontSize: 14 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {framing.insufficientOutcomes.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
