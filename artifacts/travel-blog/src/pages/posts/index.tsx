import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import { useListPosts, useListCountries } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { MapPin, Calendar, BookOpen, ArrowUpDown, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function PostsPage() {
  const { data: posts = [], isLoading } = useListPosts({
    query: { queryKey: ["posts"] },
  });
  const { data: countries = [] } = useListCountries({
    query: { queryKey: ["countries"] },
  });
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterTransport, setFilterTransport] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const transportOptions = useMemo(() => {
    const modes = new Set<string>();
    for (const c of countries) {
      for (const field of [c.transportationTo, c.transportationOnSite]) {
        if (field) field.split(",").forEach(t => modes.add(t.trim()));
      }
    }
    return Array.from(modes).sort();
  }, [countries]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    for (const p of posts) {
      if (p.publishedAt) years.add(new Date(p.publishedAt).getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [posts]);

  const filtered = useMemo(() => {
    let list = [...posts];
    if (filterCountry !== "all") {
      list = list.filter(p => p.countryId != null && String(p.countryId) === filterCountry);
    }
    if (filterTransport !== "all") {
      list = list.filter(p => {
        const country = countries.find(c => c.id === p.countryId);
        if (!country) return false;
        const modes = [country.transportationTo, country.transportationOnSite]
          .filter(Boolean).join(",").split(",").map(t => t.trim());
        return modes.includes(filterTransport);
      });
    }
    if (filterYear !== "all") {
      list = list.filter(p => p.publishedAt && new Date(p.publishedAt).getFullYear().toString() === filterYear);
    }
    list.sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return sortOrder === "newest" ? db - da : da - db;
    });
    return list;
  }, [posts, countries, filterCountry, filterTransport, filterYear, sortOrder]);

  function getFlagEmoji(code: string) {
    if (!code || code.length !== 2) return "";
    return String.fromCodePoint(
      ...code
        .toUpperCase()
        .split("")
        .map((c) => 127397 + c.charCodeAt(0)),
    );
  }

  return (
    <Layout>
      <div className="space-y-10 max-w-4xl mx-auto">
        <header className="text-center space-y-6 border-b pb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground tracking-tight">
            Travel Journal
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
            Stories, field notes, and reflections from the road.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-48" data-testid="select-filter-country">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {getFlagEmoji(c.countryCode)} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {transportOptions.length > 0 && (
            <Select value={filterTransport} onValueChange={setFilterTransport}>
              <SelectTrigger className="w-44" data-testid="select-filter-transport">
                <SelectValue placeholder="All Transport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transport</SelectItem>
                {transportOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {yearOptions.length > 0 && (
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-32" data-testid="select-filter-year">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))
            }
            className="flex items-center gap-2"
            data-testid="button-sort-order"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </Button>

          {(filterCountry !== "all" || filterTransport !== "all" || filterYear !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterCountry("all"); setFilterTransport("all"); setFilterYear("all"); }}
              className="text-muted-foreground"
              data-testid="button-clear-filters"
            >
              Clear
            </Button>
          )}

          <span className="text-sm text-muted-foreground font-mono ml-auto">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground font-serif italic animate-pulse">
            Retrieving journal entries...
          </div>
        ) : (
          <div className="grid gap-10">
            {filtered.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group grid md:grid-cols-[1fr_2fr] gap-8 items-center bg-card rounded-2xl p-4 md:p-6 border border-border/50 shadow-sm hover:shadow-md hover:border-border transition-all duration-300"
                data-testid={`card-post-${post.id}`}
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative shadow-inner">
                  {post.coverImageUrl ? (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <BookOpen className="w-12 h-12 text-primary/20" />
                    </div>
                  )}
                  {post.location && (
                    <div className="absolute top-3 left-3 bg-background/95 backdrop-blur text-foreground text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-secondary" />{" "}
                      {post.location}
                    </div>
                  )}
                </div>

                <div className="space-y-5 py-2">
                  <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(post.publishedAt), "MMM d, yyyy")}
                      </span>
                    )}
                    {post.countryId &&
                      (() => {
                        const c = countries.find(
                          (x) => x.id === post.countryId,
                        );
                        return c ? (
                          <span className="flex items-center gap-1">
                            {getFlagEmoji(c.countryCode)} {c.name}
                          </span>
                        ) : null;
                      })()}
                  </div>

                  <div>
                    <h2 className="text-3xl font-serif font-bold group-hover:text-secondary transition-colors text-foreground leading-tight">
                      <Link
                        href={`/posts/${post.slug}`}
                        data-testid={`link-post-title-${post.id}`}
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-muted-foreground mt-3 leading-relaxed text-base">
                      {post.excerpt}
                    </p>
                  </div>

                  <Link
                    href={`/posts/${post.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors uppercase tracking-wider font-sans"
                    data-testid={`link-read-post-${post.id}`}
                  >
                    Read dispatch{" "}
                    <span aria-hidden="true" className="text-lg leading-none">
                      &rarr;
                    </span>
                  </Link>
                </div>
              </motion.article>
            ))}

            {filtered.length === 0 && !isLoading && (
              <div className="text-center py-20 text-muted-foreground font-serif italic text-lg border rounded-2xl border-dashed">
                No entries match your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
