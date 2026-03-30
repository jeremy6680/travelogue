import { useState, useMemo } from "react";
import { useListCountries, useListPosts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { MapPin, Users, Heart, Navigation, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface TravelTimelineProps {
  showFilters?: boolean;
}

export function TravelTimeline({ showFilters = true }: TravelTimelineProps) {
  const { data: countries = [], isLoading } = useListCountries({ query: { queryKey: ["countries"] } });
  const { data: posts = [] } = useListPosts({ query: { queryKey: ["posts"] } });
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const filteredSorted = useMemo(() => {
    let list = [...countries];
    if (filterCountry !== "all") {
      list = list.filter(c => String(c.id) === filterCountry);
    }
    list.sort((a, b) => {
      const diff = new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });
    return list;
  }, [countries, filterCountry, sortOrder]);

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground animate-pulse font-serif italic">Unfolding the map...</div>;
  }

  return (
    <div className="space-y-8">
      {showFilters && (
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-48" data-testid="select-filter-country">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {getFlagEmoji(c.countryCode)} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(s => s === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-2"
            data-testid="button-sort-order"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </Button>

          {(filterCountry !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterCountry("all")}
              className="text-muted-foreground"
              data-testid="button-clear-filters"
            >
              Clear filters
            </Button>
          )}

          <span className="text-sm text-muted-foreground font-mono ml-auto">
            {filteredSorted.length} {filteredSorted.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      )}

      <div className="relative border-l-2 border-primary/20 ml-4 md:ml-8 py-4 space-y-16">
        {filteredSorted.map((country, idx) => {
          const countryPosts = posts.filter(p => p.countryId === country.id);

          return (
            <motion.div
              key={country.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="relative pl-8 md:pl-12"
            >
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-accent border-4 border-background shadow-sm" />

              <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                  <div>
                    <h3 className="font-serif text-3xl font-bold flex items-center gap-3 text-foreground">
                      <span className="text-4xl" aria-hidden="true">{getFlagEmoji(country.countryCode)}</span>
                      {country.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono mt-2 uppercase tracking-wider">
                      {format(new Date(country.visitedAt), "MMMM yyyy")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm bg-background/50 p-4 rounded-xl border border-border/50">
                  {country.visitedCities && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-foreground mb-0.5 font-serif">Cities Visited</strong>
                        <span className="text-muted-foreground leading-relaxed">{country.visitedCities}</span>
                      </div>
                    </div>
                  )}
                  {country.reasonForVisit && (
                    <div className="flex items-start gap-2.5">
                      <Navigation className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-foreground mb-0.5 font-serif">The Mission</strong>
                        <span className="text-muted-foreground leading-relaxed">{country.reasonForVisit}</span>
                      </div>
                    </div>
                  )}
                  {country.travelCompanions && (
                    <div className="flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-foreground mb-0.5 font-serif">Companions</strong>
                        <span className="text-muted-foreground leading-relaxed">{country.travelCompanions}</span>
                      </div>
                    </div>
                  )}
                  {country.friendsFamilyMet && (
                    <div className="flex items-start gap-2.5">
                      <Heart className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-foreground mb-0.5 font-serif">Met Along the Way</strong>
                        <span className="text-muted-foreground leading-relaxed">{country.friendsFamilyMet}</span>
                      </div>
                    </div>
                  )}
                </div>

                {countryPosts.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border/60">
                    <h4 className="font-serif font-medium mb-4 text-foreground/80 flex items-center gap-2">
                      <span className="w-8 h-px bg-border inline-block" />
                      Dispatches from {country.name}
                    </h4>
                    <div className="grid gap-3">
                      {countryPosts.map(post => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.slug}`}
                          className="group flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                          data-testid={`link-post-${post.id}`}
                        >
                          {post.coverImageUrl ? (
                            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0 shadow-sm">
                              <img src={post.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                              <MapPin className="w-6 h-6 text-primary/40" />
                            </div>
                          )}
                          <div>
                            <h5 className="font-serif font-bold text-base group-hover:text-secondary transition-colors text-foreground">{post.title}</h5>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{post.excerpt}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {filteredSorted.length === 0 && (
          <div className="text-center py-10 text-muted-foreground font-serif italic">
            No entries match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
