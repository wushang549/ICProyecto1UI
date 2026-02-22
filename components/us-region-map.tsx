"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Region = "northeast" | "northwest" | "southeast" | "southwest";

interface StateGeo {
  id: string;
  name: string;
  path: string;
  region: Region;
}

interface USRegionMapProps {
  value: string;
  onChange: (region: string) => void;
}

/* ------------------------------------------------------------------ */
/*  TopoJSON URL (US Census Bureau via us-atlas)                       */
/* ------------------------------------------------------------------ */

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

/* ------------------------------------------------------------------ */
/*  FIPS → region mapping                                              */
/* ------------------------------------------------------------------ */

const FIPS_TO_REGION: Record<string, Region> = {
  // Northeast
  "09": "northeast", "23": "northeast", "25": "northeast", "33": "northeast",
  "44": "northeast", "50": "northeast", "34": "northeast", "36": "northeast",
  "42": "northeast", "10": "northeast", "11": "northeast", "24": "northeast",
  // Northwest (West + Mountain + Upper Midwest)
  "02": "northwest", "06": "northwest", "15": "northwest", "41": "northwest",
  "53": "northwest", "08": "northwest", "16": "northwest", "30": "northwest",
  "32": "northwest", "49": "northwest", "56": "northwest", "19": "northwest",
  "17": "northwest", "18": "northwest", "27": "northwest", "26": "northwest",
  "38": "northwest", "39": "northwest", "46": "northwest", "55": "northwest",
  "20": "northwest", "29": "northwest", "31": "northwest",
  // Southeast (South Atlantic + East South Central)
  "12": "southeast", "13": "southeast", "37": "southeast", "45": "southeast",
  "51": "southeast", "54": "southeast", "21": "southeast", "47": "southeast",
  "01": "southeast", "28": "southeast",
  // Southwest (West South Central + Southwest states)
  "04": "southwest", "35": "southwest", "40": "southwest", "48": "southwest",
  "05": "southwest", "22": "southwest",
};

const REGION_LABELS: Record<Region, string> = {
  northwest: "Noroeste",
  northeast: "Noreste",
  southwest: "Suroeste",
  southeast: "Sureste",
};

/* Region colors — distinct hues so every quadrant is easy to tell apart */
const REGION_COLORS: Record<Region, string> = {
  northwest: "oklch(0.55 0.17 240)",    /* blue */
  northeast: "oklch(0.68 0.16 165)",    /* teal */
  southwest: "oklch(0.70 0.17 55)",     /* amber / orange */
  southeast: "oklch(0.60 0.20 20)",     /* warm red-coral */
};

/* Tailwind bg class for legend dots */
const REGION_DOT_CLASS: Record<Region, string> = {
  northwest: "bg-primary/70",
  northeast: "bg-accent/70",
  southwest: "bg-[oklch(0.70_0.17_55_/_0.7)]",
  southeast: "bg-[oklch(0.60_0.20_20_/_0.7)]",
};

/* ------------------------------------------------------------------ */
/*  Map dimensions & projection                                        */
/* ------------------------------------------------------------------ */

const MAP_WIDTH = 960;
const MAP_HEIGHT = 600;

const projection = geoAlbersUsa()
  .scale(1200)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

const pathGenerator = geoPath().projection(projection);

/* ------------------------------------------------------------------ */
/*  State Path Component                                               */
/* ------------------------------------------------------------------ */

const StatePath = memo(function StatePath({
  geo,
  isSelected,
  regionColor,
  onClick,
}: {
  geo: StateGeo;
  isSelected: boolean;
  regionColor: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const opacity = isSelected ? 0.6 : hovered ? 0.4 : 0.2;
  const strokeOpacity = isSelected ? 0.9 : hovered ? 0.6 : 0.35;
  const strokeWidth = isSelected ? 1.4 : hovered ? 1 : 0.6;

  return (
    <path
      d={geo.path}
      fill={regionColor}
      fillOpacity={opacity}
      stroke={regionColor}
      strokeWidth={strokeWidth}
      strokeOpacity={strokeOpacity}
      strokeLinejoin="round"
      style={{
        cursor: "pointer",
        transition: "fill-opacity 200ms ease, stroke-opacity 200ms ease, stroke-width 200ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <title>{geo.name}</title>
    </path>
  );
});

/* ------------------------------------------------------------------ */
/*  Main Map Component                                                 */
/* ------------------------------------------------------------------ */

function USRegionMap({ value, onChange }: USRegionMapProps) {
  const selectedRegion = value as Region | "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [topoData, setTopoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(GEO_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setTopoData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const states = useMemo<StateGeo[]>(() => {
    if (!topoData) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geojson = topojson.feature(topoData, topoData.objects.states) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return geojson.features
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((f: any) => {
        const fips = f.id as string;
        const region = FIPS_TO_REGION[fips];
        if (!region) return null;
        const path = pathGenerator(f);
        if (!path) return null;
        return {
          id: fips,
          name: f.properties?.name ?? fips,
          path,
          region,
        };
      })
      .filter(Boolean) as StateGeo[];
  }, [topoData]);

  const handleRegionClick = useCallback(
    (region: Region) => {
      onChange(region);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full rounded-xl border bg-card overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs">Cargando mapa...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              No se pudo cargar el mapa. Selecciona una region abajo.
            </p>
          </div>
        )}

        {!loading && !error && states.length > 0 && (
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="w-full h-auto"
            role="img"
            aria-label="Mapa interactivo de las regiones de Estados Unidos"
          >
            {states.map((geo) => (
              <StatePath
                key={geo.id}
                geo={geo}
                isSelected={geo.region === selectedRegion}
                regionColor={REGION_COLORS[geo.region]}
                onClick={() => handleRegionClick(geo.region)}
              />
            ))}
          </svg>
        )}
      </div>

      {/* Legend buttons */}
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(REGION_LABELS) as [Region, string][]).map(
          ([key, label]) => {
            const isActive = key === selectedRegion;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                )}
              >
                <span
                  className={cn(
                    "size-3 rounded-full shrink-0",
                    REGION_DOT_CLASS[key]
                  )}
                />
                {label}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

export default memo(USRegionMap);
