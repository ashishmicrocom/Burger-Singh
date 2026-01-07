import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  countryCode?: string;
  onChange?: (value: string) => void;
  error?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, countryCode = "+91", onChange, error, value, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow numbers
      const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
      onChange?.(numericValue);
    };

    const formatDisplay = (val: string) => {
      if (!val) return '';
      const cleaned = val.replace(/\D/g, '');
      if (cleaned.length <= 5) return cleaned;
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    };

    return (
      <div className="w-full">
        <div className={cn(
          "flex items-center rounded-lg border overflow-hidden transition-all duration-200",
          "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary",
          error ? "border-destructive focus-within:ring-destructive/30 focus-within:border-destructive" : "border-input",
          className
        )}>
          <div className="px-3 py-3 bg-muted border-r border-input text-sm font-medium text-muted-foreground shrink-0">
            {countryCode}
          </div>
          <input
            ref={ref}
            type="tel"
            inputMode="numeric"
            value={formatDisplay(value as string || '')}
            onChange={handleChange}
            className="flex-1 px-3 py-3 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
            placeholder="99999 99999"
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
