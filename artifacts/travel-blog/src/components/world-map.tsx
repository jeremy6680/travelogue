import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { useListMapPins, useListCountries } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function WorldMap() {
  const { data: pins = [] } = useListMapPins({ query: { queryKey: ["pins"] } });
  const { data: countries = [] } = useListCountries({ query: { queryKey: ["countries"] } });
  const [activePin, setActivePin] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([10, 20]);

  const visitedCountryCodes = useMemo(() => {
    return new Set(countries.map(c => c.countryCode.toUpperCase()));
  }, [countries]);

  const activeData = pins.find(p => p.id === activePin);

  return (
    <div className="w-full relative">
      {/* Map container */}
      <div
        className="w-full relative overflow-hidden rounded-3xl border border-border/40 shadow-xl"
        style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d1f3c 40%, #0f2840 100%)", minHeight: "520px" }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Legend */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-white/60">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#c17f4a" }} />
            Visited
          </span>
          <span className="flex items-center gap-1.5 text-white/60">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            Post
          </span>
        </div>

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
          <button
            onClick={() => setZoom(z => Math.min(z + 0.5, 4))}
            className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur transition-colors"
            data-testid="button-zoom-in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
            className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur transition-colors"
            data-testid="button-zoom-out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setZoom(1); setCenter([10, 20]); }}
            className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur transition-colors"
            data-testid="button-reset-zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <ComposableMap
          projectionConfig={{ scale: 155, center }}
          style={{ width: "100%", height: "100%", minHeight: "520px" }}
          onClick={() => setActivePin(null)}
        >
          <ZoomableGroup zoom={zoom} onMoveEnd={({ coordinates }) => setCenter(coordinates as [number, number])}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isVisited =
                    visitedCountryCodes.has(geo.properties.ISO_A2) ||
                    visitedCountryCodes.has(geo.properties.ISO_A3) ||
                    visitedCountryCodes.has(geo.id) ||
                    countries.some(c => c.name.toLowerCase() === geo.properties.name?.toLowerCase());

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isVisited ? "#c17f4a" : "#1e3a5f"}
                      stroke="#0a1628"
                      strokeWidth={0.4}
                      style={{
                        default: { outline: "none", transition: "fill 0.2s" },
                        hover: {
                          fill: isVisited ? "#d4955e" : "#2a4a72",
                          outline: "none",
                          cursor: isVisited ? "pointer" : "default",
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {pins.map((pin) => (
              <Marker key={pin.id} coordinates={[pin.longitude, pin.latitude]}>
                <g
                  className="cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setActivePin(pin.id === activePin ? null : pin.id); }}
                >
                  {/* Pulse ring */}
                  <circle
                    cx={0} cy={0} r={10}
                    fill="#f59e0b"
                    opacity={pin.id === activePin ? 0.35 : 0.2}
                    className={pin.id !== activePin ? "animate-ping" : ""}
                    style={{ animationDuration: "2s" }}
                  />
                  {/* Pin body */}
                  <circle
                    cx={0} cy={0} r={5}
                    fill={pin.id === activePin ? "#fbbf24" : "#f59e0b"}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  {/* Pin shadow */}
                  <path
                    d={`M0,5 L0,9`}
                    stroke={pin.id === activePin ? "#fbbf24" : "#f59e0b"}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </g>
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* Countries count badge */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-white/90 text-xs font-mono">
          {countries.length} countries · {pins.length} dispatches
        </div>
      </div>

      {/* Active pin popover — rendered outside map to avoid clipping */}
      {activeData && (
        <div className="mt-3 bg-card border border-border rounded-2xl shadow-lg p-5 flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-200">
          {activeData.coverImageUrl && (
            <div className="w-24 h-20 rounded-xl overflow-hidden bg-muted shrink-0 shadow-sm">
              <img src={activeData.coverImageUrl} alt={activeData.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-bold text-lg leading-tight text-foreground">{activeData.title}</h4>
            {activeData.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono uppercase tracking-wider mt-1">
                <MapPin className="w-3 h-3" /> {activeData.location}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{activeData.excerpt}</p>
          </div>
          <Link
            href={`/posts/${activeData.slug}`}
            className="shrink-0 text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors"
          >
            Read &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
