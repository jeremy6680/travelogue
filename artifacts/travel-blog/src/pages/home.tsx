import { Layout } from "@/components/layout";
import { getMediaAssetImageUrl } from "@/lib/cloudinary";
import { usePhotosQuery, usePostsQuery, useStatsQuery } from "@/lib/directus";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
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

const FALLBACK_PHOTOS = [
  { id: "f1", url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80", mediaAsset: null, caption: "Tokyo neon dreams", link: null },
  { id: "f2", url: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80", mediaAsset: null, caption: "Milford Sound", link: null },
  { id: "f3", url: "https://images.unsplash.com/photo-1598300188904-6e3b1dc9e3b6?w=600&q=80", mediaAsset: null, caption: "Chefchaouen", link: null },
  { id: "f4", url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80", mediaAsset: null, caption: "Rome at golden hour", link: null },
  { id: "f5", url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80", mediaAsset: null, caption: "Kyoto before dawn", link: null },
  { id: "f6", url: "https://images.unsplash.com/photo-1557409518-691ebcd96038?w=600&q=80", mediaAsset: null, caption: "Japanese morning", link: null },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function Home() {
  const { data: allPosts = [] } = usePostsQuery();
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
  const recentPosts = [...allPosts]
    .filter((p) => p.publishedAt)
    .sort(
      (a, b) =>
        new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime(),
    )
    .slice(0, 3);

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
        <section className="text-center space-y-8 pt-8 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-serif font-bold text-foreground tracking-tight leading-[1.05]"
          >
            Mapping the World,{" "}
            <span className="text-secondary italic font-light block">
              One Story at a Time
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed"
          >
            A collection of dispatches from dusty roads, night trains, and
            unfamiliar shores.
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
              Read Journal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/atlas"
              className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border text-foreground rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-muted transition-colors"
              data-testid="link-view-atlas"
            >
              View Atlas <Globe className="w-4 h-4" />
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
                { value: stats.totalTrips, label: "Trips" },
                { value: stats.continents, label: "Continents" },
                { value: stats.totalCities, label: "Cities" },
                { value: stats.totalPosts, label: "Dispatches" },
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
                Latest writing
              </p>
              <h2 className="text-4xl font-serif font-bold text-foreground">
                Recent Dispatches
              </h2>
            </div>
            <Link
              href="/posts"
              className="text-sm font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors flex items-center gap-1"
            >
              All posts <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {recentPosts.map((post, i) => (
              <motion.article
                key={post.id}
                {...fadeUp(i * 0.1)}
                className="group bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md hover:border-border transition-all duration-300 flex flex-col"
                data-testid={`card-post-${post.id}`}
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                  {(post.coverImage || post.coverImageUrl) ? (
                    <img
                      src={getMediaAssetImageUrl(post.coverImage, { width: 960, height: 720, crop: "fill" }) ?? post.coverImageUrl ?? ""}
                      alt={post.coverImage?.alt ?? post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <BookOpen className="w-10 h-10 text-primary/20" />
                    </div>
                  )}
                  {post.location && (
                    <div className="absolute top-3 left-3 bg-background/90 backdrop-blur text-foreground text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <MapPin className="w-3 h-3 text-secondary" />{" "}
                      {post.location}
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1 space-y-3">
                  {post.publishedAt && (
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.publishedAt), "MMM d, yyyy")}
                    </span>
                  )}
                  <h3 className="font-serif font-bold text-xl text-foreground group-hover:text-secondary transition-colors leading-snug">
                    <Link
                      href={`/posts/${post.slug}`}
                      data-testid={`link-post-title-${post.id}`}
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors inline-flex items-center gap-1 mt-auto"
                  >
                    Read dispatch <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── Instagram Feed ── */}
        <section className="space-y-8">
          <motion.div {...fadeUp()} className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase font-mono tracking-widest text-muted-foreground mb-2">
                On the road
              </p>
              <h2 className="text-4xl font-serif font-bold text-foreground">
                Photo Journal
              </h2>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gridPhotos.map((photo, i) => (
              <motion.a
                key={photo.id}
                href={photo.link ?? "#"}
                target={photo.link?.startsWith("/") ? undefined : photo.link ? "_blank" : undefined}
                rel="noopener noreferrer"
                {...fadeUp(i * 0.07)}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-muted block"
                data-testid={`card-photo-${photo.id}`}
              >
                <img
                  src={getMediaAssetImageUrl(photo.mediaAsset, { width: 720, height: 720, crop: "fill" }) ?? photo.url ?? ""}
                  alt={photo.mediaAsset?.alt ?? photo.caption ?? "Photo"}
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
                src="https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&q=80"
                alt="Traveler portrait"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="space-y-6">
            <div>
              <p className="text-xs uppercase font-mono tracking-widest text-muted-foreground mb-3">
                The wanderer
              </p>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
                About This Blog
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground font-serif leading-relaxed text-lg">
              <p>
                I'm a traveler, writer, and perpetual over-packer who believes
                the best conversations happen on overnight trains and in
                hole-in-the-wall restaurants nobody's heard of yet.
              </p>
              <p>
                This blog is my attempt to slow down and actually remember the
                places I've been — the light, the smell, the people, the awkward
                language mistakes. It's a personal record more than anything
                else.
              </p>
              <p>Currently based wherever the next flight is going.</p>
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
              Get in touch
            </p>
            <h2 className="text-4xl font-serif font-bold text-foreground">
              Say Hello
            </h2>
            <p className="text-muted-foreground font-serif italic text-lg">
              Travel tips, collaboration ideas, or just to share a story from
              the road.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)}>
            {contactSent ? (
              <div className="text-center py-16 space-y-4 bg-card rounded-3xl border border-border">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground">
                  Message received!
                </h3>
                <p className="text-muted-foreground font-serif italic">
                  Thanks for reaching out. I'll reply from wherever I am in the
                  world.
                </p>
                <button
                  onClick={() => {
                    setContactSent(false);
                    setContactForm({ name: "", email: "", message: "" });
                  }}
                  className="text-sm text-primary hover:text-secondary transition-colors font-medium"
                  data-testid="button-send-another"
                >
                  Send another message
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
                      Name
                    </label>
                    <Input
                      id="contact-name"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) =>
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
                      Email
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="your@email.com"
                      value={contactForm.email}
                      onChange={(e) =>
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
                    placeholder="Tell me where you've been, where you're going, or what you're dreaming about..."
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) =>
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
                  Send Message <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}
          </motion.div>
        </section>
      </div>
    </Layout>
  );
}
