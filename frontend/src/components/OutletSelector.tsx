import { useState, useRef, useEffect } from "react";
import { Search, MapPin, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";

interface Outlet {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state?: string;
}

interface OutletSelectorProps {
  value?: string;
  onChange: (outletId: string) => void;
  error?: string;
}

export const OutletSelector = ({ value, onChange, error }: OutletSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch outlets from backend
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const response = await apiService.getOutlets();
        if (response.success) {
          setOutlets(response.outlets);
        }
      } catch (error) {
        console.error("Failed to fetch outlets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  const selectedOutlet = outlets.find(o => o.id === value);
  const filteredOutlets = outlets.filter(outlet =>
    outlet.name.toLowerCase().includes(search.toLowerCase()) ||
    outlet.city.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 rounded-lg border bg-background text-left transition-all duration-200",
          "flex items-center gap-3",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          isOpen && "ring-2 ring-primary/30 border-primary",
          error ? "border-destructive" : "border-input"
        )}
      >
        <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          {selectedOutlet ? (
            <>
              <p className="font-medium text-foreground truncate">{selectedOutlet.name}</p>
              <p className="text-xs text-muted-foreground truncate">{selectedOutlet.address}, {selectedOutlet.city}</p>
            </>
          ) : (
            <p className="text-muted-foreground">Select outlet...</p>
          )}
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {error && (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-lg z-50 overflow-hidden animate-scale-in">
          {/* Search input */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search outlets..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading outlets...</p>
              </div>
            ) : filteredOutlets.length > 0 ? (
              filteredOutlets.map((outlet) => (
                <button
                  key={outlet.id}
                  type="button"
                  onClick={() => {
                    onChange(outlet.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3",
                    value === outlet.id && "bg-primary/5"
                  )}
                >
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{outlet.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{outlet.address}, {outlet.city}</p>
                  </div>
                  {value === outlet.id && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No outlets found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
