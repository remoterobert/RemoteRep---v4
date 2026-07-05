"use client";

import { useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

// World topojson served from jsdelivr — no data files bundled.
const WORLD_TOPOJSON =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Very lightweight country-name canonicalization for a few common
// variations users type in. Anything not in this map is used as-is
// and gets matched by exact name.
const NAME_ALIASES: Record<string, string> = {
  USA: "United States of America",
  "United States": "United States of America",
  UK: "United Kingdom",
  Russia: "Russian Federation",
};

/**
 * Renders a world choropleth colored by user count per country. Data
 * is passed in pre-aggregated as `{ countryName: count }`. Countries
 * with no users appear in the neutral surface tone.
 */
export function GeoMap({
  data,
  title = "User locations",
}: {
  data: Record<string, number>;
  title?: string;
}) {
  const { normalized, max } = useMemo(() => {
    const norm: Record<string, number> = {};
    let m = 0;
    for (const [k, v] of Object.entries(data)) {
      const canonical = NAME_ALIASES[k] ?? k;
      norm[canonical] = (norm[canonical] ?? 0) + v;
      if (norm[canonical] > m) m = norm[canonical];
    }
    return { normalized: norm, max: m };
  }, [data]);

  const topRanked = useMemo(() => {
    return Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [data]);

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey">
          {title}
        </h2>
        <span className="text-xs text-light-grey">
          {Object.keys(data).length}{" "}
          {Object.keys(data).length === 1 ? "country" : "countries"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
        <div className="w-full">
          <ComposableMap
            projectionConfig={{ scale: 130 }}
            width={800}
            height={400}
            style={{ width: "100%", height: "auto" }}
          >
            <Geographies geography={WORLD_TOPOJSON}>
              {({ geographies }: { geographies: Array<{ rsmKey: string; properties: { name: string } }> }) =>
                geographies.map((geo) => {
                  const name = geo.properties.name;
                  const count = normalized[name] ?? 0;
                  const opacity =
                    max === 0
                      ? 0
                      : Math.min(1, 0.15 + (count / max) * 0.85);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill:
                            count > 0
                              ? `rgba(0, 121, 254, ${opacity})`
                              : "var(--surface-3)",
                          stroke: "var(--border)",
                          strokeWidth: 0.4,
                          outline: "none",
                        },
                        hover: {
                          fill: "#0079fe",
                          stroke: "var(--border-strong)",
                          strokeWidth: 0.6,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#0079fe",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-light-grey font-semibold mb-2">
            Top locations
          </div>
          {topRanked.length === 0 ? (
            <p className="text-xs text-light-grey">
              No user location data yet. Fill in country on the profile edit
              page.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {topRanked.map(([country, count]) => {
                const pct = max === 0 ? 0 : (count / max) * 100;
                return (
                  <li key={country} className="text-xs">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="truncate">{country}</span>
                      <span className="font-semibold tabular-nums">
                        {count}
                      </span>
                    </div>
                    <div className="h-1 rounded bg-surface-3 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
