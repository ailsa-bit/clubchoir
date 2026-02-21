import { useState, useEffect } from "react";

export interface Member {
  firstName: string;
  lastName: string;
  location: string;
  status: "ACTIVE" | "INACTIVE" | "PROSPECT" | "TRIAL";
  joined: string;
  lastSession: string;
  paymentStatus: string;
  notes: string;
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/members.csv")
      .then((res) => res.text())
      .then((text) => {
        const lines = text.trim().split("\n");
        const parsed: Member[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 9) continue;
          parsed.push({
            firstName: cols[0].trim(),
            lastName: cols[1].trim(),
            // skip email (cols[2]) for privacy
            location: cols[3].trim(),
            status: cols[4].trim() as Member["status"],
            joined: cols[5].trim(),
            lastSession: cols[6].trim(),
            paymentStatus: cols[7].trim(),
            notes: cols[8].trim(),
          });
        }
        setMembers(parsed);
        setLoading(false);
      });
  }, []);

  return { members, loading };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
