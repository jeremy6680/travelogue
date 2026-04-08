import { useMemo } from "react";
import Markdown from "react-markdown";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Globe2,
  MapPin,
  Tag,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { getGalleryImageUrl, getMediaAssetImageUrl } from "@/lib/cloudinary";
import { usePostBySlugQuery, usePostsQuery, useTripsQuery } from "@/lib/directus";
import { useI18n } from "@/lib/i18n";
import { buildPostsBrowseHref, getPostCountryCode, sortPostsByPublishedDate } from "@/lib/post-taxonomy";
import { isExternalPost } from "@/lib/post-links";
import NotFound from "@/pages/not-found";

function RelatedPostList({
  posts,
  title,
}: {
  posts: Array<{ id: number; title: string; slug: string }>;
  title: string;
}) {
  if (posts.length === 0) return null;

  return (
    <section className="space-y-4 rounded-3xl border border-border/60 bg-card/60 p-6">
      <h3 className="font-serif text-2xl font-bold text-foreground">{title}</h3>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.slug}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-background/70 px-4 py-3 transition-colors hover:border-border hover:bg-background"
          >
            <span className="text-foreground">{post.title}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function PostDetail() {
  const { formatDate, t, countryName, locale } = useI18n();
  const { slug } = useParams();
  const { data: post, isLoading } = usePostBySlugQuery(slug);
  const { data: posts = [] } = usePostsQuery();
  const { data: trips = [] } = useTripsQuery();

  const trip = useMemo(
    () => trips.find((entry) => entry.id === post?.tripId) ?? null,
    [trips, post],
  );
  const gallery = post?.gallery ?? [];
  const hasLocalContent = Boolean(post?.content?.trim());

  const internalPosts = useMemo(
    () => sortPostsByPublishedDate(posts.filter((entry) => !isExternalPost(entry))),
    [posts],
  );

  const currentIndex = internalPosts.findIndex((entry) => entry.slug === post?.slug);
  const previousPost = currentIndex > 0 ? internalPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex >= 0 && currentIndex < internalPosts.length - 1
      ? internalPosts[currentIndex + 1]
      : null;

  const countryCode = post ? getPostCountryCode(post, trips) : null;
  const relatedByCountry = useMemo(() => {
    if (!post || !countryCode) return [];

    return internalPosts
      .filter(
        (entry) =>
          entry.id !== post.id && getPostCountryCode(entry, trips) === countryCode,
      )
      .slice(0, 4)
      .map((entry) => ({ id: entry.id, title: entry.title, slug: entry.slug }));
  }, [countryCode, internalPosts, post, trips]);

  const relatedByTrip = useMemo(() => {
    if (!post?.tripId) return [];

    return internalPosts
      .filter((entry) => entry.id !== post.id && entry.tripId === post.tripId)
      .slice(0, 4)
      .map((entry) => ({ id: entry.id, title: entry.title, slug: entry.slug }));
  }, [internalPosts, post]);

  if (isLoading) {
    return (
      <Layout>
        <div className="py-32 text-center font-serif text-lg italic text-muted-foreground animate-pulse">
          {t("loadingPost")}
        </div>
      </Layout>
    );
  }

  if (!post) {
    return <NotFound />;
  }

  const browseCountryHref = countryCode
    ? buildPostsBrowseHref({ countries: [countryCode] })
    : "/posts";
  const browseTripHref = post.tripId
    ? buildPostsBrowseHref({ tripId: post.tripId })
    : "/posts";

  return (
    <Layout>
      <article className="mx-auto max-w-4xl space-y-10 pb-20">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            {t("navHome")}
          </Link>
          <span>/</span>
          <Link href="/posts" className="hover:text-foreground transition-colors">
            {t("navJournal")}
          </Link>
          {countryCode && (
            <>
              <span>/</span>
              <Link href={browseCountryHref} className="hover:text-foreground transition-colors">
                {countryName(countryCode)}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{post.title}</span>
        </nav>

        <Link
          href="/posts"
          className="group inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {t("backToJournal")}
        </Link>

        <header className="space-y-8 border-b pb-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-mono uppercase tracking-wider text-muted-foreground">
            {post.publishedAt && (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {formatDate(post.publishedAt, "long")}
              </span>
            )}
            {post.location && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {post.location}
              </span>
            )}
          </div>

          <h1 className="text-5xl font-serif font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {post.title}
          </h1>

          <p className="mx-auto max-w-2xl font-serif text-xl italic leading-relaxed text-muted-foreground md:text-2xl">
            "{post.excerpt}"
          </p>

          {(post.category || post.tags.length > 0) && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {[post.category, ...post.tags]
                .filter((tag): tag is string => Boolean(tag))
                .map((tag) => (
                <Link
                  key={tag}
                  href={buildPostsBrowseHref({ tags: [tag] })}
                  className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground transition-colors hover:border-primary/50"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {(post.coverImage || post.coverImageUrl) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="aspect-[16/9] overflow-hidden rounded-3xl border bg-muted shadow-md md:aspect-[21/9]"
          >
            <img
              src={
                getMediaAssetImageUrl(post.coverImage, {
                  width: 1600,
                  height: 900,
                  crop: "fill",
                }) ??
                post.coverImageUrl ??
                ""
              }
              alt={post.coverImage?.alt ?? post.title}
              className="h-full w-full object-cover"
            />
          </motion.div>
        )}

        {isExternalPost(post) && (
          <section className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-amber-100 p-3 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-700">
              {t("externalArticle")}
            </p>
            <p className="text-base text-amber-900">
              {locale === "fr"
                ? "Cet article est hébergé ailleurs. Le lien ci-dessous vous fera sortir du site."
                : "This article is hosted elsewhere. The link below will take you off-site."}
            </p>
            <a
              href={post.externalUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {t("openOriginalArticle")}
            </a>
          </section>
        )}

        {hasLocalContent && (
          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-img:rounded-2xl prose-img:shadow-sm prose-p:font-sans prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-[var(--color-primary-hover)] md:prose-xl dark:prose-invert">
            <Markdown>{post.content ?? ""}</Markdown>
          </div>
        )}

        {gallery.length > 0 && (
          <section className="space-y-6 border-t border-border/60 pt-8">
            <div>
              <p className="mb-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t("fromTheRoad")}
              </p>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                {t("photoGallery")}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {gallery.map((photo, index) => (
                <motion.figure
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className={`group relative overflow-hidden rounded-xl bg-muted shadow-sm ${
                    index === 0 ? "col-span-2 aspect-[21/9]" : "aspect-square"
                  }`}
                >
                  <img
                    src={
                      getGalleryImageUrl(photo, {
                        width: index === 0 ? 1600 : 900,
                        height: 900,
                        crop: "fill",
                      }) ?? ""
                    }
                    alt={photo.alt ?? photo.caption}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-xs font-serif italic text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {photo.caption}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 border-t border-border/60 pt-8 md:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-card/60 p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {locale === "fr" ? "Navigation entre articles" : "Article navigation"}
            </p>
            <div className="mt-4 grid gap-3">
              {previousPost ? (
                <Link
                  href={`/posts/${previousPost.slug}`}
                  className="rounded-2xl border border-transparent bg-background/70 px-4 py-4 transition-colors hover:border-border hover:bg-background"
                >
                  <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                    {locale === "fr" ? "Article précédent" : "Previous article"}
                  </span>
                  <span className="mt-1 block text-foreground">{previousPost.title}</span>
                </Link>
              ) : null}
              {nextPost ? (
                <Link
                  href={`/posts/${nextPost.slug}`}
                  className="rounded-2xl border border-transparent bg-background/70 px-4 py-4 transition-colors hover:border-border hover:bg-background"
                >
                  <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                    {locale === "fr" ? "Article suivant" : "Next article"}
                  </span>
                  <span className="mt-1 block text-foreground">{nextPost.title}</span>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/60 p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {locale === "fr" ? "Explorer les articles liés" : "Explore related articles"}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {countryCode && (
                <Link
                  href={browseCountryHref}
                  className="rounded-full bg-primary/10 px-4 py-2 text-sm text-foreground transition-colors hover:bg-primary/15"
                >
                  {locale === "fr"
                    ? `Articles liés à ${countryName(countryCode)}`
                    : `Posts from ${countryName(countryCode)}`}
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <RelatedPostList
            posts={relatedByCountry}
            title={
              countryCode
                ? locale === "fr"
                  ? `Dans le même pays: ${countryName(countryCode)}`
                  : `From the same country: ${countryName(countryCode)}`
                : locale === "fr"
                  ? "Dans le même pays"
                  : "From the same country"
            }
          />
          <RelatedPostList
            posts={relatedByTrip}
            title={
              trip
                ? locale === "fr"
                  ? `Dans le même voyage: ${trip.name}`
                  : `From the same trip: ${trip.name}`
                : locale === "fr"
                  ? "Dans le même voyage"
                  : "From the same trip"
            }
          />
        </div>

        {trip && (
          <div className="mt-8 flex flex-col items-center gap-8 rounded-3xl border border-border/50 bg-card/50 p-8 md:flex-row">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
              <Globe2 className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-serif font-bold text-foreground">
                {t("moreFrom")} {trip.name}
              </h3>
              <p className="text-base text-muted-foreground">{t("exploreRegion")}</p>
            </div>
            <Link
              href={browseTripHref}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:ml-auto"
            >
              {locale === "fr" ? "Voir les articles liés" : "View related posts"}
            </Link>
          </div>
        )}
      </article>
    </Layout>
  );
}
