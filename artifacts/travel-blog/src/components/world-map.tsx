import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { useListMapPins, useListCountries } from "@workspace/api-client-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "wouter";
import { MapPin } from "lucide-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function WorldMap() {
  const { data: pins = [] } = useListMapPins({ query: { queryKey: ["pins"] } });
  const { data: countries = [] } = useListCountries({ query: { queryKey: ["countries"] } });
  
  const visitedCountryCodes = useMemo(() => {
    return new Set(countries.map(c => c.countryCode.toUpperCase()));
  }, [countries]);

  return (
    <div className="w-full relative overflow-hidden bg-card/80 rounded-2xl border shadow-sm aspect-[4/3] md:aspect-[21/9]">
      <ComposableMap projectionConfig={{ scale: 140 }}>
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // Geo id is usually ISO_A3 in this dataset, but we check common properties
                const isVisited = visitedCountryCodes.has(geo.properties.ISO_A2) || 
                                  visitedCountryCodes.has(geo.properties.ISO_A3) || 
                                  visitedCountryCodes.has(geo.id) ||
                                  countries.some(c => c.name.toLowerCase() === geo.properties.name?.toLowerCase());
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isVisited ? "hsl(var(--accent))" : "hsl(var(--muted))"}
                    stroke="hsl(var(--card))"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: isVisited ? "hsl(var(--secondary))" : "hsl(var(--muted-foreground))", outline: "none", cursor: "pointer", transition: "all 0.2s" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
          {pins.map((pin) => (
            <Marker key={pin.id} coordinates={[pin.longitude, pin.latitude]}>
              <Popover>
                <PopoverTrigger asChild>
                  <g className="cursor-pointer group">
                    <circle cx={0} cy={0} r={8} fill="hsl(var(--primary))" opacity={0.2} className="animate-ping" />
                    <circle cx={0} cy={0} r={5} fill="hsl(var(--primary))" className="group-hover:fill-secondary transition-colors" />
                    <path
                      d="M -4,-4 L 4,4 M -4,4 L 4,-4"
                      stroke="hsl(var(--background))"
                      strokeWidth={1.5}
                      opacity={0}
                    />
                  </g>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 z-50">
                  <div className="space-y-3">
                    {pin.coverImageUrl && (
                      <div className="h-28 w-full rounded-md overflow-hidden bg-muted">
                        <img src={pin.coverImageUrl} alt={pin.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h4 className="font-serif font-bold text-lg leading-tight text-foreground">{pin.title}</h4>
                    {pin.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono uppercase tracking-wider">
                        <MapPin className="w-3 h-3" /> {pin.location}
                      </p>
                    )}
                    <p className="text-sm line-clamp-3 text-foreground/80">{pin.excerpt}</p>
                    <Link href={`/posts/${pin.slug}`} className="text-sm text-secondary font-medium hover:underline inline-block">
                      Read dispatch &rarr;
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
