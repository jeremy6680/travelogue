import { useMemo } from "react";
import Markdown from "react-markdown";
import { Layout } from "@/components/layout";
import { getGalleryImageUrl, getMediaAssetImageUrl } from "@/lib/cloudinary";
import { usePostBySlugQuery, useTripsQuery } from "@/lib/directus";
import { isExternalPost } from "@/lib/post-links";
import { useParams, Link } from "wouter";
import { MapPin, Calendar, ArrowLeft, Globe2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function PostDetail() {
  const { formatDate, t } = useI18n();
  const { slug } = useParams();
  const { data: post, isLoading } = usePostBySlugQuery(slug);
  const { data: trips = [] } = useTripsQuery();

  const trip = useMemo(() => trips.find(t => t.id === post?.tripId), [trips, post]);
  const gallery = post?.gallery ?? [];
  const hasLocalContent = Boolean(post?.content?.trim());

  if (isLoading) {
    return (
      <Layout>
        <div className="py-32 text-center animate-pulse font-serif italic text-lg text-muted-foreground">
          {t("loadingPost")}
        </div>
      </Layout>
    );
  }
  if (!post) return <NotFound />;

  return (
    <Layout>
      <article className="max-w-3xl mx-auto pb-20 space-y-10">
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
          data-testid="link-back-to-journal"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t("backToJournal")}
        </Link>

        {/* Header */}
        <header className="space-y-8 text-center border-b pb-12">
          <div className="flex items-center justify-center flex-wrap gap-6 text-sm font-mono text-muted-foreground uppercase tracking-wider">
            {post.publishedAt && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {formatDate(post.publishedAt, "long")}
              </span>
            )}
            {post.location && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> {post.location}
              </span>
            )}
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground leading-tight tracking-tight">
            {post.title}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
            "{post.excerpt}"
          </p>
        </header>

        {/* Cover image */}
        {(post.coverImage || post.coverImageUrl) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-muted shadow-md border"
            data-testid="img-cover"
          >
            <img
              src={getMediaAssetImageUrl(post.coverImage, { width: 1600, height: 900, crop: "fill" }) ?? post.coverImageUrl ?? ""}
              alt={post.coverImage?.alt ?? post.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {isExternalPost(post) && (
          <section className="rounded-3xl border border-border/60 bg-card/60 p-8 text-center space-y-4">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {t("externalArticle")}
            </p>
            <p className="text-base text-muted-foreground">
              {t("articleHostedElsewhere")}
            </p>
            <a
              href={post.externalUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              {t("openOriginalArticle")}
            </a>
          </section>
        )}

        {hasLocalContent && (
          <div
            className="prose prose-lg md:prose-xl dark:prose-invert prose-p:font-sans prose-p:leading-relaxed prose-headings:font-serif prose-a:text-primary hover:prose-a:text-[var(--color-primary-hover)] max-w-none prose-img:rounded-2xl prose-img:shadow-sm"
          >
            <Markdown>{post.content ?? ""}</Markdown>
          </div>
        )}

        {/* Photo Gallery */}
        {gallery.length > 0 && (
          <section className="space-y-6 pt-8 border-t border-border/60">
            <div>
              <p className="text-xs uppercase font-mono tracking-widest text-muted-foreground mb-1">{t("fromTheRoad")}</p>
              <h2 className="text-2xl font-serif font-bold text-foreground">{t("photoGallery")}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {gallery.map((photo, i) => (
                <motion.figure
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`overflow-hidden rounded-xl bg-muted shadow-sm group relative ${i === 0 ? "col-span-2 aspect-[21/9]" : "aspect-square"}`}
                  data-testid={`img-gallery-${i}`}
                >
                  <img
                    src={getGalleryImageUrl(photo, { width: i === 0 ? 1600 : 900, height: i === 0 ? 900 : 900, crop: "fill" }) ?? ""}
                    alt={photo.alt ?? photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <figcaption className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white text-xs font-serif italic opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {photo.caption}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </section>
        )}

        {/* Trip footer */}
        {trip && (
          <div className="mt-16 pt-10 border-t flex flex-col md:flex-row items-center gap-8 bg-card/50 p-8 rounded-3xl border border-border/50">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Globe2 className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h3 className="text-2xl font-serif font-bold text-foreground">{t("moreFrom")} {trip.name}</h3>
              <p className="text-base text-muted-foreground">{t("exploreRegion")}</p>
            </div>
            <Link
              href="/trips"
              className="md:ml-auto inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              data-testid="link-view-itinerary"
            >
              {t("viewItinerary")}
            </Link>
          </div>
        )}
      </article>
    </Layout>
  );
}
