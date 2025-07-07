import { ColorPicker } from "@/components/color-picker";
import { Button } from "@/components/ui/button";
import { AvatarPreferences } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

interface PartCustomizerProps {
  part: string;
  label: string;
  styleCustomizations: Record<string, string[] | undefined>;
  preferences: AvatarPreferences;
  handlePartChange: (part: string, value: string) => void;
}

// A simple utility to format labels (e.g., "hairColor" -> "Hair Color")
const formatLabel = (str: string) => {
  return str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
};

export const PartCustomizer = ({
  part,
  label,
  styleCustomizations,
  preferences,
  handlePartChange,
}: PartCustomizerProps) => {
  const isColorPart = part.toLowerCase().includes("color");

  const options = useMemo(
    () => styleCustomizations[part] || [],
    [styleCustomizations, part]
  );
  const initialIndex = useMemo(() => {
    const value = preferences.customizations[part];
    return value ? Math.max(0, options.indexOf(value)) : 0;
  }, [preferences.customizations, part, options]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const navigateOption = (direction: "next" | "prev") => {
    const newIndex =
      direction === "next"
        ? (currentIndex + 1) % options.length
        : (currentIndex - 1 + options.length) % options.length;
    setCurrentIndex(newIndex);
    handlePartChange(part, options[newIndex]);
  };

  const handleColorChange = (color: string) => {
    handlePartChange(part, color);
  };

  const currentOptionValue = options[currentIndex];
  const currentColorValue = preferences.customizations[part] || "ffffff"; // Default to white

  if (isColorPart) {
    return (
      <div className="flex items-center justify-between gap-2 py-1.5">
        <span className="text-sm font-medium truncate">
          {formatLabel(label)}
        </span>
        <div className="flex items-center gap-2">
          <ColorPicker
            color={currentColorValue}
            onChange={handleColorChange}
            presetColors={options}
            label={label}
          />
        </div>
      </div>
    );
  }

  if (options.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-sm font-medium truncate">{formatLabel(label)}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateOption("prev")}
          className="h-7 w-7"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-center min-w-[70px] truncate">
          {formatLabel(currentOptionValue || "Default")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateOption("next")}
          className="h-7 w-7"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
