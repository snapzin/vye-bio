import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}


export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexValue, setHexValue] = useState(value);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [lightness, setLightness] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);

  // Convert hex to HSL
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    s /= 100;
    
    // If saturation is 0, return grayscale
    if (s === 0) {
      const gray = Math.round(l * 255);
      const hex = gray.toString(16).padStart(2, '0');
      return `#${hex}${hex}${hex}`.toUpperCase();
    }
    
    // HSL to RGB conversion
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  };

  // Initialize from hex value
  useEffect(() => {
    if (value && value.match(/^#[0-9A-Fa-f]{6}$/)) {
      setHexValue(value.toUpperCase());
      const hsl = hexToHsl(value);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
  }, [value]);

  // Draw color canvas - redraw when popover opens or hue changes
  useEffect(() => {
    if (!isOpen) return;
    
    const drawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        requestAnimationFrame(drawCanvas);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Draw saturation/lightness gradient (Discord style)
      // Top-left: white, Top-right: pure color, Bottom-left: black, Bottom-right: dark color
      // X axis: saturation (0% left to 100% right)
      // Y axis: lightness (100% top to 0% bottom)
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const s = (x / width) * 100;
          const l = 100 - (y / height) * 100;
          
          let hex: string;
          if (s === 0) {
            // Pure grayscale when saturation is 0
            const gray = Math.round((l / 100) * 255);
            const grayHex = gray.toString(16).padStart(2, '0');
            hex = `#${grayHex}${grayHex}${grayHex}`.toUpperCase();
          } else {
            // Use HSL to hex conversion for colored pixels
            hex = hslToHex(hue, s, l);
          }
          
          ctx.fillStyle = hex;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };

    requestAnimationFrame(drawCanvas);
  }, [hue, isOpen]);

  // Draw hue slider (horizontal) - redraw when popover opens
  useEffect(() => {
    if (!isOpen) return;
    
    const drawHue = () => {
      const canvas = hueRef.current;
      if (!canvas) {
        requestAnimationFrame(drawHue);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);

      for (let i = 0; i <= 6; i++) {
        const h = i * 60;
        gradient.addColorStop(i / 6, `hsl(${h}, 100%, 50%)`);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    requestAnimationFrame(drawHue);
  }, [isOpen]);

  const updateColorFromCanvas = (clientX: number, clientY: number, skipOnChange = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = (x / rect.width) * 100;
    const l = 100 - (y / rect.height) * 100;

    setSaturation(s);
    setLightness(l);

    const newHex = hslToHex(hue, s, l);
    setHexValue(newHex);
    
    if (!skipOnChange) {
      onChange(newHex);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    updateColorFromCanvas(e.clientX, e.clientY, false);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      updateColorFromCanvas(e.clientX, e.clientY, true);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      // Final update with onChange
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, (rect.width * saturation) / 100));
        const y = Math.max(0, Math.min(rect.height, (rect.height * (100 - lightness)) / 100));
        const s = (x / rect.width) * 100;
        const l = 100 - (y / rect.height) * 100;
        const newHex = hslToHex(hue, s, l);
        onChange(newHex);
      }
    }
    setIsDragging(false);
  };

  const updateHueFromSlider = (clientX: number, skipOnChange = false) => {
    const canvas = hueRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newHue = (x / rect.width) * 360;

    setHue(newHue);

    const newHex = hslToHex(newHue, saturation, lightness);
    setHexValue(newHex);
    
    if (!skipOnChange) {
      onChange(newHex);
    }
  };

  const handleHueMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingHue(true);
    updateHueFromSlider(e.clientX, false);
  };

  const handleHueMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingHue) {
      updateHueFromSlider(e.clientX, true);
    }
  };

  const handleHueMouseUp = () => {
    if (isDraggingHue) {
      // Final update with onChange
      const canvas = hueRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, (rect.width * hue) / 360));
        const newHue = (x / rect.width) * 360;
        const newHex = hslToHex(newHue, saturation, lightness);
        onChange(newHex);
      }
    }
    setIsDraggingHue(false);
  };

  // Global mouse events for dragging with requestAnimationFrame
  useEffect(() => {
    if (!isDragging && !isDraggingHue) return;

    let rafId: number | null = null;
    let lastUpdateTime = 0;
    const throttleMs = 16; // ~60fps

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastUpdateTime < throttleMs) return;
      lastUpdateTime = now;

      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        if (isDragging) {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
          const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
          const s = (x / rect.width) * 100;
          const l = 100 - (y / rect.height) * 100;
          setSaturation(s);
          setLightness(l);
          const newHex = hslToHex(hue, s, l);
          setHexValue(newHex);
          // Skip onChange during drag for performance
        }
        if (isDraggingHue) {
          const canvas = hueRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
          const newHue = (x / rect.width) * 360;
          setHue(newHue);
          const newHex = hslToHex(newHue, saturation, lightness);
          setHexValue(newHex);
          // Skip onChange during drag for performance
        }
      });
    };

    const handleMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      
      // Final onChange call on mouse up
      if (isDragging) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const x = Math.max(0, Math.min(rect.width, (rect.width * saturation) / 100));
          const y = Math.max(0, Math.min(rect.height, (rect.height * (100 - lightness)) / 100));
          const s = (x / rect.width) * 100;
          const l = 100 - (y / rect.height) * 100;
          const newHex = hslToHex(hue, s, l);
          onChange(newHex);
        }
      }
      if (isDraggingHue) {
        const canvas = hueRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const x = Math.max(0, Math.min(rect.width, (rect.width * hue) / 360));
          const newHue = (x / rect.width) * 360;
          const newHex = hslToHex(newHue, saturation, lightness);
          onChange(newHex);
        }
      }
      
      setIsDragging(false);
      setIsDraggingHue(false);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isDraggingHue, hue, saturation, lightness, onChange]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    if (newValue.match(/^#[0-9A-Fa-f]{0,6}$/)) {
      setHexValue(newValue);
      if (newValue.length === 7 && newValue.match(/^#[0-9A-Fa-f]{6}$/)) {
        const hsl = hexToHsl(newValue);
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
        onChange(newValue);
      }
    }
  };


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", className)}
        >
          <div className="flex items-center gap-2 w-full">
            <div
              className="w-6 h-6 rounded border border-border"
              style={{ backgroundColor: value }}
            />
            <span className="flex-1 text-sm">{value}</span>
            <Palette className="w-4 h-4 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {/* Color Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={256}
              height={256}
              className="w-full h-64 rounded-lg cursor-crosshair border border-border"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            {/* Cursor indicator */}
            <div
              className="absolute w-4 h-4 rounded-full pointer-events-none z-10"
              style={{
                left: `${(saturation / 100) * 100}%`,
                top: `${100 - (lightness / 100) * 100}%`,
                transform: 'translate(-50%, -50%)',
                border: '2px solid white',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          {/* Hue Slider */}
          <div className="relative">
            <canvas
              ref={hueRef}
              width={256}
              height={20}
              className="w-full h-5 rounded cursor-pointer"
              onMouseDown={handleHueMouseDown}
              onMouseMove={handleHueMouseMove}
              onMouseUp={handleHueMouseUp}
              onMouseLeave={handleHueMouseUp}
            />
            {/* Hue indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-white border border-black/30 rounded pointer-events-none shadow-sm z-10"
              style={{
                left: `${(hue / 360) * 100}%`,
                boxShadow: '0 0 2px rgba(0,0,0,0.5)',
              }}
            />
          </div>

          {/* Hex Input */}
          <Input
            type="text"
            value={hexValue}
            onChange={handleHexChange}
            placeholder="#000000"
            className="w-full font-mono text-sm bg-secondary/50 border-border"
            maxLength={7}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

