import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  presetColors: string[];
  label?: string;
}

export const ColorPicker = ({
  color,
  onChange,
  presetColors,
  label,
}: ColorPickerProps) => {
  const [customColor, setCustomColor] = useState(color);
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (selectedColor: string) => {
    setCustomColor(selectedColor);
    onChange(selectedColor);
    setIsOpen(false);
  };

  const handleCustomColorSubmit = () => {
    const colorValue = customColor.replace("#", "");
    if (/^[0-9A-Fa-f]{6}$/.test(colorValue)) {
      onChange(colorValue);
      setIsOpen(false);
    }
  };

  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const colorValue = e.target.value.substring(1);
    setCustomColor(colorValue);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-8 h-8 p-0 rounded-full border-2"
          style={{ backgroundColor: `#${color}` }}
        >
          <span className="sr-only">{label || "Pick color"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium">
              {label || "Choose Color"}
            </span>
          </div>

          {/* Preset Colors Grid */}
          <div className="grid grid-cols-8 gap-1">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform relative"
                style={{ backgroundColor: `#${presetColor}` }}
                onClick={() => handleColorSelect(presetColor)}
              >
                {color === presetColor && (
                  <Check className="w-3 h-3 text-white absolute inset-0 m-auto drop-shadow" />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">
              Custom Color
            </label>
            <div className="flex items-center gap-2">
              <div
                className="h-[1.5em] w-[1.5em] inline-flex overflow-hidden items-center rounded-md cursor-pointer relative"
                style={{ backgroundColor: `#${customColor}` }}
              >
                <input
                  type="color"
                  value={`#${customColor}`}
                  onChange={handleNativeColorChange}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[4em] h-[4em] overflow-hidden border-none m-0 p-0"
                />
              </div>
              <span className="text-sm">{customColor.toUpperCase()}</span>
              <Button
                size="sm"
                onClick={handleCustomColorSubmit}
                className="px-3"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
