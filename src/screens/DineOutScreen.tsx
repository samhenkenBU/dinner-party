import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Fuse from "fuse.js";
import { Search, ArrowUpDown, MapPin, ExternalLink } from "lucide-react";
import { RESTAURANTS, Restaurant } from "@/data/restaurants";
import { getRestaurantCompatibility, CompatibilityResult } from "@/lib/restaurantCompatibility";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

type SortMode = "best" | "az";

const tierBg: Record<CompatibilityResult["tierColor"], string> = {
  safe: "bg-safe",
  caution: "bg-caution",
  danger: "bg-danger",
};

const tierText: Record<CompatibilityResult["tierColor"], string> = {
  safe: "text-safe",
  caution: "text-caution",
  danger: "text-danger",
};

// Build a small colored circle SVG marker
const buildMarkerIcon = (colorVar: "safe" | "caution" | "danger") => {
  const color =
    colorVar === "safe" ? "hsl(142,71%,45%)" : colorVar === "caution" ? "hsl(45,93%,47%)" : "hsl(0,84%,60%)";
  const html = `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

const DineOutScreen = () => {
  const { user } = useApp();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("best");

  // Compatibility against current user only (no event selected)
  const userRestrictions = useMemo(() => [user.restrictions.map((r) => r.toLowerCase())], [user.restrictions]);

  const enriched = useMemo(
    () =>
      RESTAURANTS.map((r) => ({
        restaurant: r,
        compat: getRestaurantCompatibility(r, userRestrictions),
      })),
    [userRestrictions],
  );

  const fuse = useMemo(
    () =>
      new Fuse(enriched, {
        keys: ["restaurant.name", "restaurant.cuisine", "restaurant.neighborhood"],
        threshold: 0.35,
      }),
    [enriched],
  );

  const filtered = useMemo(() => {
    const list = query.trim().length >= 1 ? fuse.search(query.trim()).map((r) => r.item) : enriched;
    const sorted = [...list].sort((a, b) => {
      if (sort === "best") return b.compat.score - a.compat.score;
      return a.restaurant.name.localeCompare(b.restaurant.name);
    });
    return sorted;
  }, [query, fuse, enriched, sort]);

  const handleSelect = (r: Restaurant) => {
    toast({
      title: r.name,
      description: "Restaurant selection will link to event creation soon.",
    });
  };

  return (
    <div className="pb-24">
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Dine Out</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Find restaurants that fit your dietary needs.
        </p>
      </div>

      {/* Map */}
      <div className="mt-4 mx-4 rounded-2xl overflow-hidden shadow-warm" style={{ height: "40vh" }}>
        <MapContainer
          center={[42.3601, -71.0589]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {enriched.map(({ restaurant: r, compat }) => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={buildMarkerIcon(compat.tierColor)}>
              <Popup>
                <div className="font-body text-sm">
                  <p className="font-display font-bold text-base">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.cuisine} · {r.neighborhood}</p>
                  <p className="mt-1">
                    Match: <span className={`font-medium ${tierText[compat.tierColor]}`}>{compat.score}%</span>
                  </p>
                  <button
                    onClick={() => handleSelect(r)}
                    className="mt-2 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                  >
                    Select
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Controls */}
      <div className="px-4 mt-4 flex gap-2 items-center">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search restaurants, cuisines..."
            className="w-full rounded-lg border border-border bg-primary-foreground pl-9 pr-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => setSort((s) => (s === "best" ? "az" : "best"))}
          className="rounded-lg border border-border bg-primary-foreground px-3 py-2.5 font-body text-xs font-medium text-foreground flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sort === "best" ? "Best Match" : "A–Z"}
        </button>
      </div>

      {/* List */}
      <div className="px-4 mt-3 space-y-2">
        {filtered.map(({ restaurant: r, compat }) => (
          <div
            key={r.id}
            className="bg-primary-foreground rounded-2xl shadow-warm p-3 flex gap-3 items-center"
          >
            <img
              src={r.photoUrl}
              alt={r.name}
              loading="lazy"
              className="w-[60px] h-[60px] rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display font-bold text-sm text-foreground truncate">{r.name}</p>
                <span className={`h-2 w-2 rounded-full shrink-0 ${tierBg[compat.tierColor]}`} />
              </div>
              <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-medium">{r.cuisine}</span>
                <MapPin className="h-3 w-3" />
                {r.neighborhood}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-body text-muted-foreground">
                <span>GF {r.glutenFree}</span>
                <span>· Vegan {r.vegan}</span>
                <span>· Veg {r.vegetarian}</span>
                <span className={`ml-auto font-medium ${tierText[compat.tierColor]}`}>{compat.score}%</span>
              </div>
            </div>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(r.name + " Boston")}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg hover:bg-background text-muted-foreground"
              aria-label="Open in Google Maps"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center font-body text-sm text-muted-foreground py-8">
            No restaurants match your search.
          </p>
        )}
      </div>
    </div>
  );
};

export default DineOutScreen;
