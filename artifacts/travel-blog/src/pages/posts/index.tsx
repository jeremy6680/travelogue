import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Tag,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { CountryFlag } from "@/components/country-flag";
import { MultiSelectFilter } from "@/components/multi-select-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMediaAssetImageUrl } from "@/lib/cloudinary";
import { usePostsQuery, useTripsQuery } from "@/lib/directus";
import { useI18n } from "@/lib/i18n";
import { getPostHref, isExternalPost } from "@/lib/post-links";
import { blogPostTitleHoverClass } from "@/lib/post-title-hover";
import {
  getPostCountryCode,
  getPostTrip,
  parsePostsBrowseState,
  sortPostsByPublishedDate,
} from "@/lib/post-taxonomy";
import { postMatchesKeyword } from "@/lib/travel-insights";
import type { Post, Trip } from "@/lib/travel-types";

const PAGE_SIZE = 6;

function buildCountryOptions(
  posts: Post[],
  trips: Trip[],
  countryName: (code: string) => string,
) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    const code = getPostCountryCode(post, trips);
    if (!code) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([code, count]) => ({
      value: code,
      text: countryName(code),
      count,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.text.localeCompare(right.text, "fr");
    });
}

function buildTagOptions(posts: Post[]) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    const values = [...post.tags];
    if (post.category) values.unshift(post.category);

    for (const value of new Set(values.filter(Boolean))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.value.localeCompare(right.value, "fr");
    });
}

function buildYearOptions(posts: Post[]) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    if (!post.publishedAt) continue;
    const year = new Date(post.publishedAt).getFullYear().toString();
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => Number(right.value) - Number(left.value));
}

export default function PostsPage() {
  const { countryName, formatCountLabel, formatDate, locale, t } = useI18n();
  const [location] = useLocation();
  const { data: posts = [], isLoading } = usePostsQuery();
  const { data: trips = [] } = useTripsQuery();
  const [filterCountries, setFilterCountries] = useState<string[]>([]);
  const [filterYears, setFilterYears] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterTripId, setFilterTripId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const search =
      typeof window !== "undefined" ? window.location.search : "";
    const state = parsePostsBrowseState(search);
    setFilterCountries(state.countries);
    setFilterTags(state.tags);
    setFilterTripId(state.tripId);
    setPage(state.page);
  }, [location]);

  const countryOptions = useMemo(
    () => buildCountryOptions(posts, trips, countryName),
    [countryName, posts, trips],
  );

  const yearOptions = useMemo(() => buildYearOptions(posts), [posts]);

  const tagOptions = useMemo(() => buildTagOptions(posts), [posts]);

  const filtered = useMemo(() => {
    let list = [...posts];

    if (filterCountries.length > 0) {
      list = list.filter((post) => {
        const code = getPostCountryCode(post, trips);
        return code ? filterCountries.includes(code) : false;
      });
    }

    if (filterTripId != null) {
      list = list.filter((post) => post.tripId === filterTripId);
    }

    if (filterYears.length > 0) {
      list = list.filter(
        (post) =>
          post.publishedAt &&
          filterYears.includes(new Date(post.publishedAt).getFullYear().toString()),
      );
    }

    if (filterTags.length > 0) {
      list = list.filter((post) => {
        const terms = new Set([post.category, ...post.tags].filter(Boolean));
        return filterTags.some((tag) => terms.has(tag));
      });
    }

    if (searchQuery.trim()) {
      list = list.filter((post) => {
        const trip = getPostTrip(post, trips);
        return postMatchesKeyword(post, searchQuery, trip);
      });
    }

    list = sortPostsByPublishedDate(list);
    if (sortOrder === "oldest") {
      list.reverse();
    }

    return list;
  }, [
    filterCountries,
    filterTags,
    filterTripId,
    filterYears,
    posts,
    searchQuery,
    sortOrder,
    trips,
  ]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const clearFilters = () => {
    setFilterCountries([]);
    setFilterYears([]);
    setFilterTags([]);
    setFilterTripId(null);
    setSearchQuery("");
    setPage(1);
  };

  const toggleTagFilter = (tag: string) => {
    setPage(1);
    setFilterTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag],
    );
  };

  const setSingleCountryFilter = (countryCode: string) => {
    setFilterCountries([countryCode]);
    setPage(1);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-6 border-b pb-12 text-center">
          <h1 className="text-5xl font-serif font-bold tracking-tight text-foreground md:text-6xl">
            {t("travelJournal")}
          </h1>
          <p className="mx-auto max-w-2xl font-serif text-xl italic leading-relaxed text-muted-foreground">
            {t("journalSubtitle")}
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <MultiSelectFilter
            label={locale === "fr" ? "Tous les pays" : "All countries"}
            placeholder={locale === "fr" ? "Tous les pays" : "All countries"}
            options={countryOptions.map((option) => ({
              value: option.value,
              label: (
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <CountryFlag
                      code={option.value}
                      countryName={option.text}
                      className="h-3.5 w-5 rounded-[2px] object-cover"
                    />
                    <span>{option.text}</span>
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                    {option.count}
                  </span>
                </span>
              ),
              triggerLabel: option.text,
            }))}
            selectedValues={filterCountries}
            onChange={(values) => {
              setFilterCountries(values);
              setPage(1);
            }}
            className="w-52"
            data-testid="select-filter-country"
          />

          {yearOptions.length > 0 && (
            <MultiSelectFilter
              label={t("allYears")}
              placeholder={t("allYears")}
              options={yearOptions.map((option) => ({
                value: option.value,
                label: (
                  <span className="flex items-center justify-between gap-3">
                    <span>{option.value}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                      {option.count}
                    </span>
                  </span>
                ),
                triggerLabel: option.value,
              }))}
              selectedValues={filterYears}
              onChange={(values) => {
                setFilterYears(values);
                setPage(1);
              }}
              className="w-40"
              data-testid="select-filter-year"
            />
          )}

          <Input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            placeholder={locale === "fr" ? "Recherche mot-clé" : "Keyword search"}
            className="w-52"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSortOrder((current) =>
                current === "newest" ? "oldest" : "newest",
              )
            }
            className="flex items-center gap-2"
            data-testid="button-sort-order"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === "newest" ? t("newestFirst") : t("oldestFirst")}
          </Button>

          {(filterCountries.length > 0 ||
            filterYears.length > 0 ||
            filterTags.length > 0 ||
            filterTripId != null ||
            searchQuery.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              {t("clear")}
            </Button>
          )}

          <span className="ml-auto inline-flex rounded-full bg-primary/10 px-3 py-1 font-mono text-sm text-foreground">
            {formatCountLabel(filtered.length)}
          </span>
        </div>

        {tagOptions.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>{locale === "fr" ? "Tags et catégories" : "Tags and categories"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((option) => {
                const isActive = filterTags.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleTagFilter(option.value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    }`}
                  >
                    <span>{option.value}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs ${
                        isActive ? "bg-white/20" : "bg-muted"
                      }`}
                    >
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {isLoading ? (
          <div className="py-20 text-center font-serif italic text-muted-foreground animate-pulse">
            {t("retrievingEntries")}
          </div>
        ) : paginatedPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed px-6 py-16 text-center text-muted-foreground">
            {t("noEntries")}
          </div>
        ) : (
          <div className="grid gap-8">
            {paginatedPosts.map((post, index) => {
              const trip = getPostTrip(post, trips);
              const countryCode = getPostCountryCode(post, trips);
              const category = post.category?.trim() || null;
              const tags = post.tags.filter((tag): tag is string => Boolean(tag?.trim()));

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="group grid items-start gap-8 rounded-3xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-300 hover:border-border hover:shadow-md md:grid-cols-[1fr_2fr]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-inner">
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
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/5">
                        <BookOpen className="h-12 w-12 text-primary/20" />
                      </div>
                    )}
                    {post.location && (
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {post.location}
                      </div>
                    )}
                  </div>

                  <div className="space-y-5 py-2">
                    <div className="flex flex-wrap items-start justify-between gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-4">
                        {post.publishedAt && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(post.publishedAt, "short")}
                          </span>
                        )}
                        {countryCode && (
                          <button
                            type="button"
                            onClick={() => setSingleCountryFilter(countryCode)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-lightest)] px-2.5 py-1 text-foreground transition-colors hover:bg-[var(--color-primary-light)]"
                          >
                            <CountryFlag
                              code={countryCode}
                              countryName={countryName(countryCode)}
                              className="h-3.5 w-5 rounded-[2px] object-cover"
                            />
                            <span>{countryName(countryCode)}</span>
                          </button>
                        )}
                      </div>

                      {(category || tags.length > 0) && (
                        <div className="flex flex-wrap justify-end gap-2">
                          {category && (
                            <button
                              type="button"
                              onClick={() => toggleTagFilter(category)}
                              className={`rounded-full border px-2.5 py-1 transition-colors ${
                                filterTags.includes(category)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100"
                              }`}
                            >
                              {category}
                            </button>
                          )}
                          {tags.map((tag) => (
                            <button
                              key={`${post.id}-${tag}`}
                              type="button"
                              onClick={() => toggleTagFilter(tag)}
                              className={`rounded-full border px-2.5 py-1 transition-colors ${
                                filterTags.includes(tag)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300 hover:bg-sky-100"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h2 className="font-serif text-3xl font-bold leading-tight text-foreground">
                        {isExternalPost(post) ? (
                          <a
                            href={getPostHref(post)}
                            target="_blank"
                            rel="noreferrer"
                            className={blogPostTitleHoverClass}
                          >
                            {post.title}
                          </a>
                        ) : (
                          <Link href={getPostHref(post)} className={blogPostTitleHoverClass}>
                            {post.title}
                          </Link>
                        )}
                      </h2>

                      <p className="text-base leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    </div>

                    {isExternalPost(post) && (
                      <div className="inline-flex max-w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <p className="leading-none">
                          {locale === "fr"
                            ? "Article externe - vous allez quitter Travelogue pour lire cet article."
                            : "External article - you are about to leave Travelogue to read this article."}
                        </p>
                      </div>
                    )}

                    <div>
                      {isExternalPost(post) ? (
                        <a
                          href={getPostHref(post)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          {t("readExternalArticle")}
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      ) : (
                        <Link
                          href={getPostHref(post)}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          {t("readDispatch")}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {pageCount > 1 && (
          <nav className="flex flex-col items-center gap-4 border-t pt-8">
            <div className="text-sm text-muted-foreground">
              {locale === "fr" ? "Page" : "Page"} {page} / {pageCount}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {locale === "fr" ? "Précédent" : "Previous"}
              </Button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
                <Button
                  key={value}
                  variant={value === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(value)}
                  className="min-w-10"
                >
                  {value}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page === pageCount}
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
              >
                {locale === "fr" ? "Suivant" : "Next"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </nav>
        )}
      </div>
    </Layout>
  );
}
