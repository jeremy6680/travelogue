import React from "react";
import { useListCountries, useListPosts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { MapPin, Users, Heart, Navigation } from "lucide-react";

function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function TravelTimeline() {
  const { data: countries = [], isLoading: loadingCountries } = useListCountries({ query: { queryKey: ["countries"] } });
  const { data: posts = [] } = useListPosts({ query: { queryKey: ["posts"] } });

  if (loadingCountries) return <div className="py-20 text-center text-muted-foreground animate-pulse font-serif italic">Unfolding the map...</div>;

  // Sort countries newest first
  const sortedCountries = [...countries].sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());

  return (
    <div className="relative border-l-2 border-primary/20 ml-4 md:ml-8 py-8 space-y-16">
      {sortedCountries.map((country, idx) => {
        const countryPosts = posts.filter(p => p.countryId === country.id);
        
        return (
          <motion.div 
            key={country.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="relative pl-8 md:pl-12"
          >
            {/* Timeline dot */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm mt-6 bg-background/50 p-4 rounded-xl border border-border/50">
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
                    <span className="w-8 h-px bg-border inline-block"></span>
                    Dispatches from {country.name}
                  </h4>
                  <div className="grid gap-3">
                    {countryPosts.map(post => (
                      <Link key={post.id} href={`/posts/${post.slug}`} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
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
      
      {sortedCountries.length === 0 && (
        <div className="text-center py-10 text-muted-foreground font-serif italic">
          No countries recorded yet.
        </div>
      )}
    </div>
  );
}
