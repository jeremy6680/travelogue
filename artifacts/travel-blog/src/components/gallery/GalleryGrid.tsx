/**
 * GalleryGrid.tsx — responsive photo grid with a keyboard-accessible lightbox.
 *
 * Receives pre-built GalleryImage objects (thumbnails + full URLs + dimensions).
 * Dimensions are used to set aspect-ratio on each cell, preventing layout shift
 * while images load.
 *
 * Keyboard navigation:
 *   ArrowRight / ArrowLeft — next / previous image
 *   Escape               — close lightbox
 */

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "@/lib/galleries";

interface GalleryGridProps {
  images: GalleryImage[];
  title: string;
}

export function GalleryGrid({ images, title }: GalleryGridProps) {
  // Index of the currently open lightbox image; null = closed
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // --- Keyboard navigation ---
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i! + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i! - 1 + images.length) % images.length);
      } else if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    },
    [lightboxIndex, images.length],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // --- Lock body scroll when lightbox is open ---
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  return (
    <>
      {/* Photo grid — 2 columns on mobile, 3 on md, 4 on xl */}
      <ul
        className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4"
        aria-label={`Photos from ${title}`}
      >
        {images.map((image, index) => (
          <li key={image.publicId}>
            <button
              type="button"
              className="group block w-full overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={`Open photo ${index + 1} of ${images.length}`}
              onClick={() => setLightboxIndex(index)}
            >
              <img
                src={image.thumbnailUrl}
                alt={image.alt || ""}
                loading="lazy"
                decoding="async"
                width={image.width}
                height={image.height}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Lightbox overlay */}
      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Image container — stops click propagation so clicking the image doesn't close */}
          <div
            className="relative flex max-h-screen max-w-screen-xl flex-col items-center px-14"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex].fullUrl}
              alt={
                images[lightboxIndex].alt ||
                `Photo ${lightboxIndex + 1} of ${images.length} — ${title}`
              }
              className="max-h-[88vh] max-w-full object-contain shadow-2xl"
            />

            {/* Counter */}
            <p className="mt-3 font-mono text-sm text-white/60">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>

          {/* Previous button */}
          <button
            type="button"
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i! - 1 + images.length) % images.length);
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Next button */}
          <button
            type="button"
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i! + 1) % images.length);
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Close button */}
          <button
            type="button"
            aria-label="Close lightbox"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
