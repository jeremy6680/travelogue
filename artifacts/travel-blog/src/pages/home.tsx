import { Layout } from "@/components/layout";
import { getMediaAssetImageUrl } from "@/lib/cloudinary";
import { usePhotosQuery, usePostsQuery, useStatsQuery, useTripsQuery } from "@/lib/directus";
import { getPostHref, isExternalPost } from "@/lib/post-links";
import { getPostCountryCode } from "@/lib/post-taxonomy";
import { blogPostTitleHoverClass } from "@/lib/post-title-hover";
import { getHomeFeaturedPosts } from "@/lib/post-taxonomy";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  Calendar,
  BookOpen,
  Instagram,
  Twitter,
  Mail,
  Globe,
  Send,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";

const FALLBACK_PHOTOS = [
  {
    id: "f1",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    mediaAsset: null,
    caption: "Tokyo, néons et insomnies",
    link: null,
  },
  {
    id: "f2",
    url: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80",
    mediaAsset: null,
    caption: "Milford Sound",
    link: null,
  },
  {
    id: "f3",
    url: "https://images.unsplash.com/photo-1598300188904-6e3b1dc9e3b6?w=600&q=80",
    mediaAsset: null,
    caption: "Chefchaouen",
    link: null,
  },
  {
    id: "f4",
    url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80",
    mediaAsset: null,
    caption: "Rome à l'heure dorée",
    link: null,
  },
  {
    id: "f5",
    url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80",
    mediaAsset: null,
    caption: "Kyoto avant l'aube",
    link: null,
  },
  {
    id: "f6",
    url: "https://images.unsplash.com/photo-1557409518-691ebcd96038?w=600&q=80",
    mediaAsset: null,
    caption: "Matin japonais",
    link: null,
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

function getFlagEmoji(code: string) {
  if (!code || code.length !== 2) return "";

  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0)),
  );
}

export default function Home() {
  const { countryName, formatDate, locale, t } = useI18n();
  const { data: allPosts = [] } = usePostsQuery();
  const { data: trips = [] } = useTripsQuery();
  const { data: stats } = useStatsQuery();
  const { data: dbPhotos = [] } = usePhotosQuery();
  const gridPhotos = dbPhotos.length > 0 ? dbPhotos : FALLBACK_PHOTOS;
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  // 3 most recent published posts
  const recentPosts = getHomeFeaturedPosts(allPosts, 3);
  const hasCustomFeaturedPosts = allPosts.some((post) => post.featuredOnHome);

  function handleContact(e: React.FormEvent) {
    e.preventDefault();
    const body = new URLSearchParams({
      "form-name": "contact",
      ...contactForm,
    });
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
      .then(() => setContactSent(true))
      .catch(() => setContactSent(true));
  }

  return (
    <Layout>
      <div className="space-y-32">
        {/* ── Hero ── */}
        <section className="text-center space-y-8 pt-8 max-w-4xl mx-auto bg-[var(--color-bg-warm)] border border-[var(--color-border)] rounded-[2rem] px-6 py-10">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-serif font-bold text-foreground tracking-tight leading-[1.05]"
          >
            {t("heroTitle")}{" "}
            <span className="text-[var(--color-primary-mid)] italic font-light block">
              {t("heroTitleAccent")}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed"
          >
            {t("heroSubtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-sm"
              data-testid="link-read-journal"
            >
              {t("readJournal")} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/atlas"
              className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border text-foreground rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-muted transition-colors"
              data-testid="link-view-atlas"
            >
              {t("viewAtlas")} <Globe className="w-4 h-4" />
            </Link>
          </motion.div>

          {stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap justify-center gap-12 pt-4 border-t border-border/40 mt-8"
            >
              {[
                { value: stats.totalTrips, label: t("statTrips") },
                { value: stats.continents, label: t("statContinents") },
                { value: stats.totalCities, label: t("statCities") },
                { value: stats.totalPosts, label: t("statDispatches") },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <span className="block text-4xl font-serif font-bold text-primary">
                    {value}
                  </span>
                  <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </section>

        {/* ── Recent Dispatches ── */}
        <section className="space-y-10">
          <motion.div {...fadeUp()} className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase font-mono tracking-widest text-muted-foreground mb-2">
                {hasCustomFeaturedPosts
                  ? formatDate(new Date(), "monthYear")
                  : t("latestWriting")}
              </p>
              <h2 className="text-4xl font-serif font-bold text-foreground">
                {hasCustomFeaturedPosts
                  ? locale === "fr"
                    ? "Articles mis en avant"
                    : "Featured Stories"
                  : t("recentDispatches")}
              </h2>
            </div>
            <Link
              href="/posts"
              className="text-sm font-bold uppercase tracking-wider text-primary hover:text-[var(--color-primary-hover)] transition-colors flex items-center gap-1"
            >
              {t("allPosts")} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {recentPosts.map((post, i) => {
              const countryCode = getPostCountryCode(post, trips);
              const category = post.category?.trim() || null;
              const tags = post.tags.filter((tag): tag is string => Boolean(tag?.trim()));

              return (
                <motion.article
                  key={post.id}
                  {...fadeUp(i * 0.1)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:border-border hover:shadow-md"
                  data-testid={`card-post-${post.id}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {post.coverImage || post.coverImageUrl ? (
                      <img
                        src={
                          getMediaAssetImageUrl(post.coverImage, {
                            width: 960,
                            height: 720,
                            crop: "fill",
                          }) ??
                          post.coverImageUrl ??
                          ""
                        }
                        alt={post.coverImage?.alt ?? post.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/5">
                        <BookOpen className="h-10 w-10 text-primary/20" />
                      </div>
                    )}
                    {post.location && (
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs text-foreground shadow-sm backdrop-blur">
                        <MapPin className="h-3 w-3 text-primary" />
                        {post.location}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-3">
                        {post.publishedAt && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.publishedAt, "short")}
                          </span>
                        )}
                        {countryCode && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-lightest)] px-2.5 py-1 text-foreground">
                            <span>{getFlagEmoji(countryCode)}</span>
                            <span>{countryName(countryCode)}</span>
                          </span>
                        )}
                      </div>
                      {(category || tags.length > 0) && (
                        <div className="flex flex-wrap justify-end gap-2">
                          {category && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-900">
                              {category}
                            </span>
                          )}
                          {tags.map((tag) => (
                            <span
                              key={`${post.id}-${tag}`}
                              className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-900"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif text-[1.35rem] font-bold leading-snug text-foreground md:text-2xl">
                      {isExternalPost(post) ? (
                        <a
                          href={getPostHref(post)}
                          target="_blank"
                          rel="noreferrer"
                          className={blogPostTitleHoverClass}
                          data-testid={`link-post-title-${post.id}`}
                        >
                          {post.title}
                        </a>
                      ) : (
                        <Link
                          href={getPostHref(post)}
                          className={blogPostTitleHoverClass}
                          data-testid={`link-post-title-${post.id}`}
                        >
                          {post.title}
                        </Link>
                      )}
                    </h3>
                    <p className="flex-1 text-sm text-muted-foreground line-clamp-3">
                      {post.excerpt}
                    </p>
                    {isExternalPost(post) && (
                      <div className="inline-flex max-w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <p className="leading-none">
                          {locale === "fr"
                            ? "Article externe - vous allez quitter Travelogue."
                            : "External article - you are leaving Travelogue."}
                        </p>
                      </div>
                    )}
                    {isExternalPost(post) ? (
                      <a
                        href={getPostHref(post)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        {t("readExternalArticle")}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <Link
                        href={getPostHref(post)}
                        className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        {t("readDispatch")}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* ── Instagram Feed ── */}
        <section className="space-y-8">
          <motion.div {...fadeUp()} className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase font-mono tracking-widest text-muted-foreground mb-2">
                {t("onTheRoad")}
              </p>
              <h2 className="text-4xl font-serif font-bold text-foreground">
                {t("photoJournal")}
              </h2>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gridPhotos.map((photo, i) => (
              <motion.a
                key={photo.id}
                href={photo.link ?? "#"}
                target={
                  photo.link?.startsWith("/")
                    ? undefined
                    : photo.link
                      ? "_blank"
                      : undefined
                }
                rel="noopener noreferrer"
                {...fadeUp(i * 0.07)}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-muted block"
                data-testid={`card-photo-${photo.id}`}
              >
                <img
                  src={
                    getMediaAssetImageUrl(photo.mediaAsset, {
                      width: 720,
                      height: 720,
                      crop: "fill",
                    }) ??
                    photo.url ??
                    ""
                  }
                  alt={
                    photo.mediaAsset?.alt ??
                    photo.caption ??
                    t("photoFallbackAlt")
                  }
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {photo.caption && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-white text-sm font-serif leading-snug line-clamp-3">
                      {photo.caption}
                    </p>
                  </div>
                )}
              </motion.a>
            ))}
          </div>
        </section>

        {/* ── About ── */}
        <section id="about" className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp()}>
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-muted shadow-xl">
              <img
                src="https://res.cloudinary.com/dylqfjiax/image/upload/q_auto/f_auto/v1775400941/mini-jey_gvyat0.png"
                alt="Portrait de voyageur"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="space-y-6">
            <div>
              <p className="text-xs uppercase font-mono tracking-widest text-muted-foreground mb-3">
                Le voyageur
              </p>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
                À propos de ce blog
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground font-serif leading-relaxed text-lg">
              <p>
                Je suis un voyageur, un auteur et un éternel adepte du sac trop
                plein, convaincu que les meilleures conversations naissent dans
                les trains de nuit et les restaurants que personne ne connaît
                encore.
              </p>
              <p>
                Ce blog est ma manière de ralentir et de vraiment me souvenir
                des lieux traversés : la lumière, les odeurs, les gens, les
                maladresses de langage. C'est avant tout une mémoire
                personnelle.
              </p>
              <p>Basé, pour l'instant, là où part le prochain vol.</p>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                data-testid="link-social-instagram"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                data-testid="link-social-twitter"
                aria-label="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="mailto:hey@jeremymarchandeau.com"
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                data-testid="link-social-email"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="max-w-2xl mx-auto space-y-8">
          <motion.div {...fadeUp()} className="text-center space-y-3">
            <p className="text-xs uppercase font-mono tracking-widest text-muted-foreground">
              Me contacter
            </p>
            <h2 className="text-4xl font-serif font-bold text-foreground">
              Dire bonjour
            </h2>
            <p className="text-muted-foreground font-serif italic text-lg">
              Conseils de voyage, idées de collaboration ou simple envie de
              partager une histoire de route.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)}>
            {contactSent ? (
              <div className="text-center py-16 space-y-4 bg-card rounded-3xl border border-border">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground">
                  Message reçu !
                </h3>
                <p className="text-muted-foreground font-serif italic">
                  Merci pour ton message. Je répondrai depuis l'endroit du monde
                  où je me trouve.
                </p>
                <button
                  onClick={() => {
                    setContactSent(false);
                    setContactForm({ name: "", email: "", message: "" });
                  }}
                  className="text-sm text-primary hover:text-[var(--color-primary-hover)] transition-colors font-medium"
                  data-testid="button-send-another"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleContact}
                className="space-y-4 bg-card rounded-3xl border border-border p-8"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="contact-name"
                    >
                      Nom
                    </label>
                    <Input
                      id="contact-name"
                      placeholder="Ton nom"
                      value={contactForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setContactForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="contact-email"
                    >
                      E-mail
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="ton@email.com"
                      value={contactForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setContactForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="contact-message"
                  >
                    Message
                  </label>
                  <Textarea
                    id="contact-message"
                    placeholder="Raconte-moi d'où tu viens, où tu vas, ou ce que tu rêves encore de vivre..."
                    rows={5}
                    value={contactForm.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setContactForm((f) => ({ ...f, message: e.target.value }))
                    }
                    required
                    data-testid="input-contact-message"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  data-testid="button-submit-contact"
                >
                  Envoyer le message <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}
          </motion.div>
        </section>
      </div>
    </Layout>
  );
}
