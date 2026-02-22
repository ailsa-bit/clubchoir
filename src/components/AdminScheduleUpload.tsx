import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  onComplete: () => void;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += char; }
  }
  result.push(current);
  return result;
}

function parseDate(dateStr: string): string {
  // Format: DD-MMM-YY e.g. 02-Feb-26
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return dateStr;
  const day = parts[0].padStart(2, "0");
  const month = months[parts[1]] || "01";
  const year = `20${parts[2]}`;
  return `${year}-${month}-${day}`;
}

const AdminScheduleUpload = ({ onComplete }: Props) => {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setMessage("Processing CSV…");

    try {
      const text = await file.text();
      const lines = text.trim().split("\n");

      const rows: { week: string; location: string; session_date: string; activity: string; artist: string | null }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 5) continue;
        rows.push({
          week: cols[0].trim(),
          location: cols[1].trim(),
          session_date: parseDate(cols[2].trim()),
          activity: cols[3].trim(),
          artist: cols[4]?.trim() || null,
        });
      }

      if (rows.length === 0) throw new Error("No valid rows found in CSV");

      // Get unique locations to clear old data
      const locations = [...new Set(rows.map(r => r.location))];

      // Delete existing sessions for these locations
      for (const loc of locations) {
        await supabase.from("location_sessions").delete().eq("location", loc);
      }

      // Insert in batches of 50
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from("location_sessions").insert(batch);
        if (error) throw error;
      }

      setStatus("done");
      setMessage(`Uploaded ${rows.length} sessions for ${locations.join(", ")}.`);
      setTimeout(onComplete, 1500);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Upload failed");
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground mb-3">
        Upload a CSV with columns: <strong>Week, Location, Date, Activity, Artist</strong>
      </p>
      {status === "idle" || status === "error" ? (
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">
          <Upload className="w-4 h-4" /> Choose CSV File
          <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </label>
      ) : null}
      {status === "uploading" && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          {message}
        </p>
      )}
      {status === "done" && (
        <p className="text-sm text-accent-foreground flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {message}
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-destructive flex items-center gap-2 mt-2">
          <AlertCircle className="w-4 h-4" /> {message}
        </p>
      )}
    </div>
  );
};

export default AdminScheduleUpload;
