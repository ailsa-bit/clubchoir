import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ChoirPhoto } from "@/assets/photos";

interface PhotoGalleryProps {
  photos: ChoirPhoto[];
  /** Tile grid columns at lg breakpoint. Defaults to 3. */
  columns?: 2 | 3 | 4;
}

/**
 * Responsive masonry-feel grid of choir photos.
 * Click any tile to open it full-size in a lightbox dialog.
 */
const PhotoGallery = ({ photos, columns = 3 }: PhotoGalleryProps) => {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const colClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      <div className={`grid grid-cols-1 ${colClass} gap-4`}>
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={photo.alt[language]}
          >
            <img
              src={photo.tile}
              alt={photo.alt[language]}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-card border-border">
          {openIndex !== null && (
            <figure className="flex flex-col">
              <img
                src={photos[openIndex].wide}
                alt={photos[openIndex].alt[language]}
                className="w-full h-auto max-h-[80vh] object-contain bg-muted"
              />
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoGallery;
