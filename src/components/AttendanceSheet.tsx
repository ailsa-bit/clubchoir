import "./AttendanceSheet.css";

type AttendanceRow = {
  name: string;
  email: string;
  location: string;
  status: string;
  night?: string;
};

export function AttendanceSheet({ rows, showLocation }: { rows: AttendanceRow[]; showLocation: boolean }) {
  return (
    <div className="attendance-flow">
      {rows.map((row, index) => {
        const firstGuest = row.status === "Trial guest" && (index === 0 || rows[index - 1].status !== "Trial guest");
        return (
          <div key={`${row.email}-${index}`} className="attendance-entry">
            {firstGuest && <h3 className="pt-4 pb-1 font-heading font-bold text-base border-b border-border">Trial night guests</h3>}
            <div className={`attendance-row ${showLocation ? "attendance-with-location" : ""}`}>
              <span className="text-muted-foreground text-sm">{index + 1}</span>
              <span className="text-foreground font-semibold text-lg print:text-base leading-tight">
                {row.name}
                {row.status === "Trial guest" && row.night && <span className="ml-2 text-xs font-normal text-muted-foreground">(trial {row.night})</span>}
              </span>
              {showLocation && <span className="text-muted-foreground text-sm">{row.location}</span>}
              <span aria-label="Present" className="inline-block w-16 border-b border-border h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}