import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarPreferences } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface PartCustomizerProps {
  part: string;
  label: string;
  styleCustomizations: Record<string, string[]>;
  preferences: AvatarPreferences;
  handlePartChange: (part: string, value: string) => void;
}

export const PartCustomizer = ({
  part,
  label,
  styleCustomizations,
  preferences,
  handlePartChange,
}: PartCustomizerProps) => {
  const getInitialIndex = (value: string | undefined, options: string[] = []) => {
    if (!value) return 0;
    return options.indexOf(value);
  };

  const [currentIndex, setCurrentIndex] = useState(
    () => getInitialIndex(preferences.customizations[part], styleCustomizations[part])
  );

  const showColorPreview = part.toLowerCase().includes("color");

  const navigateOption = (
    direction: "next" | "prev"
  ) => {
    const options = styleCustomizations[part] || [];
    let newIndex;

    if (direction === "next") {
      newIndex = (currentIndex + 1) % options.length;
    } else {
      newIndex = (currentIndex - 1 + options.length) % options.length;
    }

    setCurrentIndex(newIndex);
    handlePartChange(part, options[newIndex]);
  };

  const getDisplayName = (value: string) => {
    if (!value) return "Default";
    return (
      value.charAt(0).toUpperCase() + value.slice(1).replace(/([A-Z])/g, " $1")
    );
  };

  const ColorPreview = ({
    color,
    size = "w-6 h-6",
  }: {
    color: string;
    size?: string;
  }) => (
    <div
      className={`${size} rounded-md border-2 border-border`}
      style={{ backgroundColor: `#${color}` }}
    />
  );

  const options = styleCustomizations[part] || [];
  const currentValue = options[currentIndex];

  if (options.length === 0) return null;

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span className="text-xs font-medium truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateOption("prev")}
          disabled={options.length <= 1}
          className="h-6 w-6 p-0"
        >
          <ChevronLeft className="w-3 h-3" />
        </Button>
        <div className="flex items-center space-x-2 min-w-0 flex-1 justify-center">
          {showColorPreview && currentValue && (
            <ColorPreview color={currentValue} />
          )}
          <span className="text-sm font-medium truncate">
            {getDisplayName(currentValue)}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateOption("next")}
          disabled={options.length <= 1}
          className="h-6 w-6 p-0"
        >
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
