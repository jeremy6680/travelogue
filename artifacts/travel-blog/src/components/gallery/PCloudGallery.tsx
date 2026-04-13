import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Images } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePCloudPublicGallery } from "@/lib/pcloud";
import { cn } from "@/lib/utils";

export function PCloudGallery({
  publicLink,
  locale,
  className,
}: {
  publicLink: string;
  locale: "fr" | "en";
  className?: string;
}) {
  const { data = [], isLoading, error } = usePCloudPublicGallery(publicLink);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const selectedImage =
    selectedImageIndex !== null && selectedImageIndex >= 0 ? data[selectedImageIndex] : null;

  const hasMultipleImages = data.length > 1;

  const goToPreviousImage = () => {
    if (selectedImageIndex === null || data.length === 0) return;
    setSelectedImageIndex((selectedImageIndex - 1 + data.length) % data.length);
  };

  const goToNextImage = () => {
    if (selectedImageIndex === null || data.length === 0) return;
    setSelectedImageIndex((selectedImageIndex + 1) % data.length);
  };

  useEffect(() => {
    if (selectedImageIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousImage();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, data.length]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Images className="h-4 w-4 text-primary" />
          <span>
            {isLoading
              ? locale === "fr"
                ? "Chargement de la galerie..."
                : "Loading gallery..."
              : locale === "fr"
                ? `${data.length} image${data.length > 1 ? "s" : ""}`
                : `${data.length} image${data.length > 1 ? "s" : ""}`}
          </span>
        </div>
        <a
          href={publicLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4"
        >
          {locale === "fr" ? "Ouvrir dans pCloud" : "Open in pCloud"}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {error ? (
        <div className="rounded-[1.25rem] border border-dashed border-border bg-background/80 p-5 text-sm leading-7 text-muted-foreground">
          {locale === "fr"
            ? "Impossible de charger la galerie pCloud pour le moment."
            : "Unable to load the pCloud gallery right now."}
        </div>
      ) : null}

      {!error && !isLoading && data.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-border bg-background/80 p-5 text-sm leading-7 text-muted-foreground">
          {locale === "fr"
            ? "Le dossier pCloud est accessible, mais aucune image exploitable n’a été trouvée."
            : "The pCloud folder is reachable, but no usable images were found."}
        </div>
      ) : null}

      {data.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {data.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={cn(
                "group overflow-hidden rounded-[1.25rem] border border-border/60 bg-muted text-left transition-transform hover:-translate-y-0.5",
                index === 0 && "col-span-2 md:col-span-2",
              )}
            >
              <div className={cn("overflow-hidden", index === 0 ? "aspect-[16/10]" : "aspect-square")}>
                <img
                  src={image.thumbUrl}
                  alt={image.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-4 py-3">
                <p className="truncate text-sm text-foreground">{image.name}</p>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
        <DialogContent className="max-w-5xl border-border/60 bg-background/95 p-3 sm:rounded-[1.5rem] sm:p-4">
          {selectedImage ? (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{selectedImage.name}</DialogTitle>
                <DialogDescription>{locale === "fr" ? "Aperçu de l'image" : "Image preview"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 px-1 pr-14">
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedImage.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedImageIndex !== null ? `${selectedImageIndex + 1} / ${data.length}` : ""}
                    </p>
                  </div>
                  {hasMultipleImages ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={goToPreviousImage}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        aria-label={locale === "fr" ? "Photo précédente" : "Previous image"}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNextImage}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        aria-label={locale === "fr" ? "Photo suivante" : "Next image"}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="overflow-hidden rounded-[1.25rem] bg-black">
                  <img
                    src={selectedImage.previewUrl}
                    alt={selectedImage.name}
                    className="max-h-[80vh] w-full object-contain"
                  />
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
