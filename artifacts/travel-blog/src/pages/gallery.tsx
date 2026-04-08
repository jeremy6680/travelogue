/**
 * GalleryPage.tsx — photo gallery page fetched live from jeysblog.
 *
 * Route: /galleries/:slug
 *
 * No data is stored in Directus. The slug is the only key shared between
 * Travelogue and jeysblog. Any gallery that exists on jeysblog is
 * automatically available here without any manual intervention.
 */

import { Link, useParams } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Layout } from "@/components/layout";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { useGalleryQuery } from "@/lib/galleries";
import { useI18n } from "@/lib/i18n";

/** Skeleton grid shown while the gallery is loading */
function GallerySkeleton() {
  return (
    <ul
      className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading gallery…"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <li key={i}>
          <div
            className="aspect-square w-full animate-pulse rounded-xl bg-muted"
            aria-hidden="true"
          />
        </li>
      ))}
    </ul>
  );
}

export default function GalleryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { formatDate } = useI18n();

  const { data: gallery, isLoading, isError, error } = useGalleryQuery(slug);

  // --- Loading state ---
  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header skeleton */}
          <div className="space-y-3">
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          </div>
          <GallerySkeleton />
        </div>
      </Layout>
    );
  }

  // --- Error / 404 state ---
  if (isError || !gallery) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl py-24 text-center">
          <p className="font-serif text-lg italic text-muted-foreground">
            {(error as Error)?.message ?? "Gallery not found."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground underline hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="mx-auto max-w-6xl space-y-8 pb-20">

        {/* Back link */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Home
        </Link>

        {/* Gallery header */}
        <header className="space-y-3 border-b border-border/60 pb-8">
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            {gallery.title}
          </h1>

          {gallery.date && (
            <p className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              <time dateTime={gallery.date}>{formatDate(gallery.date, "long")}</time>
            </p>
          )}

          {gallery.excerpt && (
            <p className="max-w-2xl font-serif text-lg italic leading-relaxed text-muted-foreground">
              "{gallery.excerpt}"
            </p>
          )}

          {/* Backlink to original gallery on jeysblog */}
          <a
            href={gallery.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/70 underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
          >
            View on carnet.jeremymarchandeau.com
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </header>

        {/* Photo count */}
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {gallery.images.length} photos
        </p>

        {/* The grid + lightbox */}
        <GalleryGrid images={gallery.images} title={gallery.title} />

      </article>
    </Layout>
  );
}
