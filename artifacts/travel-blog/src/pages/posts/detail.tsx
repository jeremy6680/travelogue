import { useMemo } from "react";
import { Layout } from "@/components/layout";
import { useListPosts, useListCountries } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { MapPin, Calendar, ArrowLeft, Globe2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import { motion } from "framer-motion";

export default function PostDetail() {
  const { slug } = useParams();
  const { data: posts = [], isLoading } = useListPosts({ query: { queryKey: ["posts"] } });
  const { data: countries = [] } = useListCountries({ query: { queryKey: ["countries"] } });

  const post = useMemo(() => posts.find(p => p.slug === slug), [posts, slug]);
  const country = useMemo(() => countries.find(c => c.id === post?.countryId), [countries, post]);
  const gallery = post?.gallery ?? [];

  if (isLoading) {
    return (
      <Layout>
        <div className="py-32 text-center animate-pulse font-serif italic text-lg text-muted-foreground">
          Unearthing the dispatch...
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
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Journal
        </Link>

        {/* Header */}
        <header className="space-y-8 text-center border-b pb-12">
          <div className="flex items-center justify-center flex-wrap gap-6 text-sm font-mono text-muted-foreground uppercase tracking-wider">
            {post.publishedAt && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {format(new Date(post.publishedAt), "MMMM d, yyyy")}
              </span>
            )}
            {post.location && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-secondary" /> {post.location}
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
        {post.coverImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-muted shadow-md border"
            data-testid="img-cover"
          >
            <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
          </motion.div>
        )}

        {/* Content */}
        <div className="prose prose-lg md:prose-xl dark:prose-invert prose-p:font-sans prose-p:leading-relaxed prose-headings:font-serif prose-a:text-secondary hover:prose-a:text-secondary/80 max-w-none prose-img:rounded-2xl prose-img:shadow-sm">
          {post.content.split("\n").map((paragraph, idx) =>
            paragraph.trim() ? <p key={idx}>{paragraph}</p> : <br key={idx} />
          )}
        </div>

        {/* Photo Gallery */}
        {gallery.length > 0 && (
          <section className="space-y-6 pt-8 border-t border-border/60">
            <div>
              <p className="text-xs uppercase font-mono tracking-widest text-muted-foreground mb-1">From the road</p>
              <h2 className="text-2xl font-serif font-bold text-foreground">Photo Gallery</h2>
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
                    src={photo.url}
                    alt={photo.caption}
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

        {/* Country footer */}
        {country && (
          <div className="mt-16 pt-10 border-t flex flex-col md:flex-row items-center gap-8 bg-card/50 p-8 rounded-3xl border border-border/50">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Globe2 className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h3 className="text-2xl font-serif font-bold text-foreground">More from {country.name}</h3>
              <p className="text-base text-muted-foreground">Explore other dispatches and notes from this region.</p>
            </div>
            <Link
              href="/countries"
              className="md:ml-auto inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              data-testid="link-view-itinerary"
            >
              View Itinerary
            </Link>
          </div>
        )}
      </article>
    </Layout>
  );
}
