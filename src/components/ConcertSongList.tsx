import { useEffect, useRef } from "react";
import { Download, ExternalLink, ListOrdered, ChevronRight } from "lucide-react";
import concertListPdf from "@/assets/club-choir-concert-song-list.pdf.asset.json";
import { CONCERT_SONGS, BREAK_AFTER, SHOWCASE_DATES, type ConcertPart } from "@/data/concertSongList";
import { trackResourceView } from "@/lib/trackResourceView";

const FILE_NAME = "club-choir-concert-song-list.pdf";

export function ConcertSongList({ language, onOpenWeek }: { language: string; onOpenWeek: (week: number) => void }) {
  const fr = language === "fr";
  const ref = useRef<HTMLElement>(null);

  // Arriving from the email link (#concert-song-list): scroll once the page has rendered
  useEffect(() => {
    if (window.location.hash === "#concert-song-list") {
      const t = setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      return () => clearTimeout(t);
    }
  }, []);

  const partLabel = (p: ConcertPart) =>
    p === "melody" ? (fr ? "Mélodie" : "Melody") : (fr ? "Harmonies" : "Parts / Harmony");

  const track = (event: "open" | "download") =>
    trackResourceView({ page: "fall-2026", song: "Concert song list", event, resourceType: "concert_list", fileName: FILE_NAME });

  return (
    <section id="concert-song-list" ref={ref} className="mb-6 scroll-mt-24 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-2">
        <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
          <ListOrdered className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            {fr ? "Liste des chansons du spectacle — dans l'ordre" : "Concert Song List — In Order"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {fr
              ? "Insérez cette liste dans votre cartable et placez vos feuilles de paroles dans cet ordre. Nous avons 3 semaines de révision et nous répéterons dans l'ordre du spectacle."
              : "Please insert this into your binder and place your lyric sheets in this order. We have 3 review weeks, and we will rehearse in the order we are performing."}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 my-4">
        <a
          href={concertListPdf.url}
          download={FILE_NAME}
          onClick={() => track("download")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Download className="w-4 h-4" /> {fr ? "Télécharger la liste (PDF)" : "Download the list (PDF)"}
        </a>
        <a
          href={concertListPdf.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("open")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
        >
          <ExternalLink className="w-4 h-4" /> {fr ? "Ouvrir pour imprimer" : "Open to print"}
        </a>
      </div>

      <ol className="space-y-2">
        {CONCERT_SONGS.map((s) => (
          <li key={s.order}>
            <button
              onClick={() => onOpenWeek(s.week)}
              className="w-full text-left rounded-lg border border-border bg-background p-3 flex items-center gap-3 hover:border-primary/50 transition"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{s.order}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-tight">{s.title}</span>
                <span className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-pink-light px-2 py-0.5 font-semibold text-foreground">
                    {fr ? "Rose" : "Pink"} : {partLabel(s.pink)}
                  </span>
                  <span className="rounded-full bg-powder-blue-light px-2 py-0.5 font-semibold text-foreground">
                    {fr ? "Bleu" : "Blue"} : {partLabel(s.blue)}
                  </span>
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
            </button>
            {s.order === BREAK_AFTER && (
              <p className="my-3 rounded-lg bg-muted px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {fr ? "Courte pause — participation du public" : "Short break — audience participation"}
              </p>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-lg bg-muted/60 p-4">
        <h3 className="font-heading font-bold text-foreground mb-2">{fr ? "Dates du spectacle" : "Showcase dates"}</h3>
        <ul className="space-y-1 text-sm text-foreground/90">
          {SHOWCASE_DATES.map((d) => (
            <li key={d.city}><strong>{d.city}</strong> — {fr ? d.fr : d.en}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
