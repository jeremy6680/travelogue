import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import { getMediaAssetImageUrl } from "@/lib/cloudinary";
import { usePostsQuery, useTripsQuery } from "@/lib/directus";
import type { Trip } from "@/lib/travel-types";
import { Link } from "wouter";
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
import { useI18n } from "@/lib/i18n";

function getFlagEmoji(code: string) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0)),
  );
}

function getCountryFilterOptions(
  trips: Trip[],
  countryName: (code: string) => string,
) {
  const counts = new Map<string, number>();

  for (const trip of trips) {
    const code = trip.countryCode.toUpperCase();
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([code, count]) => ({
      value: code,
      label: `${getFlagEmoji(code)} ${countryName(code)} (${count})`,
      count,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.label.localeCompare(right.label, "fr");
    });
}

export default function PostsPage() {
  const { countryName, formatCountLabel, formatDate, t } = useI18n();
  const { data: posts = [], isLoading } = usePostsQuery();
  const { data: trips = [] } = useTripsQuery();
  const [filterTrip, setFilterTrip] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const tripCountryOptions = useMemo(
    () => getCountryFilterOptions(trips, countryName),
    [countryName, trips],
  );

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    for (const p of posts) {
      if (p.publishedAt) years.add(new Date(p.publishedAt).getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [posts]);

  const filtered = useMemo(() => {
    let list = [...posts];
    if (filterTrip !== "all") {
      list = list.filter((post) => {
        const trip = trips.find((currentTrip) => currentTrip.id === post.tripId);
        const countryCode = trip?.countryCode ?? post.countryCode;
        return countryCode?.toUpperCase() === filterTrip;
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
  }, [posts, trips, filterTrip, filterYear, sortOrder]);

  return (
    <Layout>
      <div className="space-y-10 max-w-4xl mx-auto">
        <header className="text-center space-y-6 border-b pb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground tracking-tight">
            {t("travelJournal")}
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
            {t("journalSubtitle")}
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterTrip} onValueChange={setFilterTrip}>
            <SelectTrigger className="w-48" data-testid="select-filter-trip">
              <SelectValue placeholder={t("allTrips")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTrips")}</SelectItem>
              {tripCountryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {yearOptions.length > 0 && (
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-32" data-testid="select-filter-year">
                <SelectValue placeholder={t("allYears")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allYears")}</SelectItem>
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
            {sortOrder === "newest" ? t("newestFirst") : t("oldestFirst")}
          </Button>

          {(filterTrip !== "all" || filterYear !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterTrip("all"); setFilterYear("all"); }}
              className="text-muted-foreground"
              data-testid="button-clear-filters"
            >
              {t("clear")}
            </Button>
          )}

          <span className="text-sm text-muted-foreground font-mono ml-auto">
            {formatCountLabel(filtered.length)}
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground font-serif italic animate-pulse">
            {t("retrievingEntries")}
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
                  {(post.coverImage || post.coverImageUrl) ? (
                    <img
                      src={getMediaAssetImageUrl(post.coverImage, { width: 960, height: 720, crop: "fill" }) ?? post.coverImageUrl ?? ""}
                      alt={post.coverImage?.alt ?? post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <BookOpen className="w-12 h-12 text-primary/20" />
                    </div>
                  )}
                  {post.location && (
                    <div className="absolute top-3 left-3 bg-background/95 backdrop-blur text-foreground text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-primary" />{" "}
                      {post.location}
                    </div>
                  )}
                </div>

                <div className="space-y-5 py-2">
                  <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(post.publishedAt, "short")}
                      </span>
                    )}
                    {post.tripId &&
                      (() => {
                        const t = trips.find(
                          (x) => x.id === post.tripId,
                        );
                        return t ? (
                          <span className="flex items-center gap-1">
                            {getFlagEmoji(t.countryCode)} {countryName(t.countryCode)}
                          </span>
                        ) : null;
                      })()}
                  </div>

                  <div>
                    <h2 className="text-3xl font-serif font-bold group-hover:text-primary transition-colors text-foreground leading-tight">
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
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-[var(--color-primary-hover)] transition-colors uppercase tracking-wider font-sans"
                    data-testid={`link-read-post-${post.id}`}
                  >
                    {t("readDispatch")}{" "}
                    <span aria-hidden="true" className="text-lg leading-none">
                      &rarr;
                    </span>
                  </Link>
                </div>
              </motion.article>
            ))}

            {filtered.length === 0 && !isLoading && (
              <div className="text-center py-20 text-muted-foreground font-serif italic text-lg border rounded-2xl border-dashed">
                {t("noEntries")}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
