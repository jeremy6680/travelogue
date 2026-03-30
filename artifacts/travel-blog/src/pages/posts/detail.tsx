import React, { useMemo } from "react";
import { Layout } from "@/components/layout";
import { useListPosts, useListCountries } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { MapPin, Calendar, ArrowLeft, Globe2 } from "lucide-react";
import NotFound from "@/pages/not-found";

export default function PostDetail() {
  const { slug } = useParams();
  const { data: posts = [], isLoading: postsLoading } = useListPosts({ query: { queryKey: ["posts"] } });
  const { data: countries = [] } = useListCountries({ query: { queryKey: ["countries"] } });

  const post = useMemo(() => posts.find(p => p.slug === slug), [posts, slug]);
  const country = useMemo(() => countries.find(c => c.id === post?.countryId), [countries, post]);

  if (postsLoading) return <Layout><div className="py-32 text-center animate-pulse font-serif italic text-lg text-muted-foreground">Unearthing the dispatch...</div></Layout>;
  if (!post) return <NotFound />;

  return (
    <Layout>
      <article className="max-w-3xl mx-auto space-y-10 pb-20">
        <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Journal
        </Link>
        
        <header className="space-y-8 text-center border-b pb-12">
          <div className="flex items-center justify-center gap-6 text-sm font-mono text-muted-foreground uppercase tracking-wider">
            {post.publishedAt && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> {format(new Date(post.publishedAt), "MMMM d, yyyy")}
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

        {post.coverImageUrl && (
          <div className="w-full aspect-[16/9] md:aspect-[2.5/1] rounded-2xl overflow-hidden bg-muted shadow-md border my-12">
            <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-lg md:prose-xl dark:prose-invert prose-p:font-sans prose-p:leading-relaxed prose-headings:font-serif prose-a:text-secondary hover:prose-a:text-secondary/80 max-w-none prose-img:rounded-2xl prose-img:shadow-sm">
          {post.content.split('\n').map((paragraph, idx) => (
            paragraph.trim() ? <p key={idx}>{paragraph}</p> : <br key={idx} />
          ))}
        </div>
        
        {country && (
          <div className="mt-20 pt-10 border-t flex flex-col md:flex-row items-center gap-8 bg-card/50 p-8 rounded-3xl border border-border/50">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Globe2 className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h3 className="text-2xl font-serif font-bold text-foreground">More from {country.name}</h3>
              <p className="text-base text-muted-foreground">Explore other dispatches and notes from this region.</p>
            </div>
            <Link href="/countries" className="md:ml-auto inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
              View Itinerary
            </Link>
          </div>
        )}
      </article>
    </Layout>
  );
}
