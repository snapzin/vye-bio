import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorInputProps {
  defaultValue?: string;
  value?: string;
  onChange?: (color: string) => void;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ColorInput({
  defaultValue = "#000000",
  value,
  onChange,
  placeholder = "Escolha uma cor",
  size = "md",
  className,
}: ColorInputProps) {
  const [internalValue, setInternalValue] = useState(value || defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use controlled value if provided, otherwise use internal state
  const currentValue = value !== undefined ? value : internalValue;

  // Convert hex string to number
  const hexToNumber = (hex: string): number => {
    const cleaned = hex.replace("#", "");
    return parseInt(cleaned, 16);
  };

  // Convert number to hex string
  const numberToHex = (num: number): string => {
    return `#${num.toString(16).padStart(6, "0").toUpperCase()}`;
  };

  const handleColorChange = (newColor: string) => {
    if (value === undefined) {
      setInternalValue(newColor);
    }
    onChange?.(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Validate hex color
    if (/^#?[0-9A-Fa-f]{0,6}$/.test(inputValue)) {
      const hexValue = inputValue.startsWith("#") ? inputValue : `#${inputValue}`;
      handleColorChange(hexValue);
    }
  };

  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  // Preset colors
  const presetColors = [
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
    "#FFFF00", "#FF00FF", "#00FFFF", "#808080", "#800000",
    "#008000", "#000080", "#808000", "#800080", "#008080",
  ];

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={currentValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              className={cn(
                sizeClasses[size],
                "pr-10",
                "bg-transparent",
                "border border-[rgb(32,34,37)]",
                "rounded-md",
                "text-foreground",
                "text-sm",
                "font-['Montserrat']",
                "focus:border-ring",
                "focus:outline-none",
                "focus:ring-0",
                "focus-visible:ring-0"
              )}
              style={{
                backgroundColor: "transparent",
                border: "1px solid rgb(32, 34, 37)",
                borderRadius: "6px",
                color: "hsl(var(--foreground))",
                fontSize: "14px",
                fontFamily: "Montserrat",
              }}
            />
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-input cursor-pointer"
              style={{
                backgroundColor: currentValue,
                border: "1px solid hsl(var(--input))",
                borderRadius: "4px",
              }}
              onClick={() => setIsOpen(true)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-4"
          style={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--input))",
            borderRadius: "6px",
          }}
        >
          <div className="space-y-4">
            {/* Color picker input */}
            <div>
              <Input
                type="color"
                value={currentValue}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
            </div>

            {/* Preset colors */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Cores predefinidas</p>
              <div className="grid grid-cols-5 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded border-2 transition-all",
                      currentValue.toUpperCase() === color.toUpperCase()
                        ? "border-foreground scale-110"
                        : "border-input hover:scale-105"
                    )}
                    style={{
                      backgroundColor: color,
                      border: `1px solid ${
                        currentValue.toUpperCase() === color.toUpperCase()
                          ? "hsl(var(--foreground))"
                          : "hsl(var(--input))"
                      }`,
                      borderRadius: "4px",
                    }}
                    onClick={() => {
                      handleColorChange(color);
                      setIsOpen(false);
                    }}
                    aria-label={`Selecionar cor ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Hex input */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Código HEX</label>
              <Input
                type="text"
                value={currentValue}
                onChange={handleInputChange}
                placeholder="#000000"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

