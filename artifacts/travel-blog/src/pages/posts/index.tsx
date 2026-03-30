import React from "react";
import { Layout } from "@/components/layout";
import { useListPosts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { MapPin, Calendar, BookOpen } from "lucide-react";

export default function PostsPage() {
  const { data: posts = [], isLoading } = useListPosts({ query: { queryKey: ["posts"] } });

  return (
    <Layout>
      <div className="space-y-12 max-w-4xl mx-auto">
        <header className="space-y-4 border-b pb-12 text-center">
          <h1 className="text-5xl font-serif font-bold text-foreground">Travel Journal</h1>
          <p className="text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto">
            Stories, field notes, and reflections from the road.
          </p>
        </header>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground font-serif italic animate-pulse">
            Retrieving journal entries...
          </div>
        ) : (
          <div className="grid gap-10">
            {posts.map((post, i) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group grid md:grid-cols-[1fr_2fr] gap-8 items-center bg-card rounded-2xl p-4 md:p-6 border border-border/50 shadow-sm hover:shadow-md hover:border-border transition-all duration-300"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative shadow-inner">
                  {post.coverImageUrl ? (
                    <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <BookOpen className="w-12 h-12 text-primary/20" />
                    </div>
                  )}
                  {post.location && (
                    <div className="absolute top-3 left-3 bg-background/95 backdrop-blur text-foreground text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-secondary" /> {post.location}
                    </div>
                  )}
                </div>
                
                <div className="space-y-5 py-2">
                  <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {format(new Date(post.publishedAt), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-serif font-bold group-hover:text-secondary transition-colors text-foreground leading-tight">
                      <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <p className="text-muted-foreground mt-3 leading-relaxed text-base">
                      {post.excerpt}
                    </p>
                  </div>
                  
                  <Link href={`/posts/${post.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors uppercase tracking-wider font-sans">
                    Read dispatch <span aria-hidden="true" className="text-lg leading-none">&rarr;</span>
                  </Link>
                </div>
              </motion.article>
            ))}
            
            {posts.length === 0 && (
              <div className="text-center py-20 text-muted-foreground font-serif italic text-lg border rounded-2xl border-dashed">
                No journal entries yet. The adventure is just beginning.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
