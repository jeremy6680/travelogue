import { useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { useListMapPins, useListCountries } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function WorldMap() {
  const { data: pins = [] } = useListMapPins({ query: { queryKey: ["pins"] } });
  const { data: countries = [] } = useListCountries({ query: { queryKey: ["countries"] } });
  const [activePin, setActivePin] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([10, 20]);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  const visitedCountryCodes = useMemo(() => {
    return new Set(countries.map(c => c.countryCode.toUpperCase()));
  }, [countries]);

  const activeData = pins.find(p => p.id === activePin);

  const handlePinClick = (e: React.MouseEvent, pinId: number) => {
    e.stopPropagation();
    const newPinId = pinId === activePin ? null : pinId;
    setActivePin(newPinId);
    if (newPinId !== null && outerRef.current) {
      const rect = outerRef.current.getBoundingClientRect();
      setPopoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setPopoverPos(null);
    }
  };

  const handleMapClick = () => {
    setActivePin(null);
    setPopoverPos(null);
  };

  return (
    <div ref={outerRef} className="w-full relative">
      {/* Map container */}
      <div
        className="w-full relative overflow-hidden rounded-3xl border border-border/40 shadow-xl"
        style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d1f3c 40%, #0f2840 100%)", minHeight: "380px" }}
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
          style={{ width: "100%", height: "100%", minHeight: "380px" }}
          onClick={handleMapClick}
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
                  onClick={(e) => handlePinClick(e, pin.id)}
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

      {/* Active pin popover — absolutely positioned over the map near the clicked pin */}
      {activeData && popoverPos && (() => {
        const containerWidth = outerRef.current?.clientWidth ?? 800;
        const popoverWidth = 260;
        const left = popoverPos.x + 14 + popoverWidth > containerWidth
          ? popoverPos.x - 14 - popoverWidth
          : popoverPos.x + 14;
        const top = Math.max(popoverPos.y - 80, 8);
        return (
          <div
            className="absolute z-20 bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-4 animate-in fade-in duration-200"
            style={{ left, top, width: popoverWidth }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-muted/60 text-muted-foreground hover:bg-muted flex items-center justify-center"
              onClick={() => { setActivePin(null); setPopoverPos(null); }}
            >
              <X className="w-3 h-3" />
            </button>
            {activeData.coverImageUrl && (
              <div className="w-full h-28 rounded-xl overflow-hidden bg-muted mb-3 shadow-sm">
                <img src={activeData.coverImageUrl} alt={activeData.title} className="w-full h-full object-cover" />
              </div>
            )}
            <h4 className="font-serif font-bold text-base leading-tight text-foreground pr-4">{activeData.title}</h4>
            {activeData.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono uppercase tracking-wider mt-1">
                <MapPin className="w-3 h-3" /> {activeData.location}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{activeData.excerpt}</p>
            <Link
              href={`/posts/${activeData.slug}`}
              className="inline-block mt-3 text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors"
            >
              Read &rarr;
            </Link>
          </div>
        );
      })()}
    </div>
  );
}
