"use client";

import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/maps/world";
import { useEffect } from "react";

export function TopCountriesMap() {
  useEffect(() => {
    new jsVectorMap({
      selector: "#mapTwo",
      map: "world",
      zoomButtons: true,
      regionStyle: {
        initial: {
          fill: "#A9BDFF",
        },
        hover: {
          fillOpacity: 1,
          fill: "#3056D3",
        },
      },
    });
  }, []);

  return (
    <div className="flex h-65 items-center justify-center md:h-95">
      <div id="mapTwo" className="mapTwo map-btn" />
    </div>
  );
}
