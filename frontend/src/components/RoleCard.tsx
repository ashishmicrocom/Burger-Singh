import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
}

export const RoleCard = ({ icon: Icon, title, description, selected, onClick }: RoleCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "card-interactive p-6 text-left w-full group",
        "flex items-start gap-4",
        selected && "border-primary ring-2 ring-primary/20"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
          selected 
            ? "bg-primary text-primary-foreground shadow-glow" 
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </div>
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 shrink-0 mt-1 transition-all duration-200",
          selected 
            ? "border-primary bg-primary" 
            : "border-muted-foreground/30"
        )}
      >
        {selected && (
          <svg className="w-full h-full text-primary-foreground p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  );
};
