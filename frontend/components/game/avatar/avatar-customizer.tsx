import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Shuffle, RotateCcw } from "lucide-react";
import { useAvatarCustomization } from "@/hooks/useAvatarCustomization";
import { allAvatarOptions } from "@/data/avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Player } from "@/lib/types";
import { AvatarStyle } from "@/data/avatar";
import { PartCustomizer } from "./part-customizer";

interface AvatarCustomizerPropsGemini {
  currentPlayer: Player;
  availableAvatarStyles: string[];
  onAvatarChange: (style: string, parts: Record<string, string>) => void;
}

export const AvatarCustomizer = ({
  currentPlayer,
  availableAvatarStyles,
  onAvatarChange,
}: AvatarCustomizerPropsGemini) => {
  if (!currentPlayer || !currentPlayer.avatarStyle) return null;
  console.log("currentPlayer", currentPlayer);
  const { preferences, generateAvatarUrl, updateStyle, updateCustomization } =
    useAvatarCustomization(currentPlayer.id, currentPlayer.avatarStyle);

  const handleStyleChange = (style: string) => {
    updateStyle(style);
    onAvatarChange(style, {});
  };

  const handlePartChange = (part: string, value: string) => {
    const newCustomizations = { ...preferences.customizations, [part]: value };
    updateCustomization(part, value);
    onAvatarChange(preferences.style, newCustomizations);
  };

  const currentAvatarUrl = generateAvatarUrl({
    style: preferences.style,
    seed: preferences.seed,
    customizations: preferences.customizations,
  });

  const styleCustomizations =
    allAvatarOptions[preferences.style as AvatarStyle] || null;

  return (
    <Card className="backdrop-blur-lg border-border shadow-2xl rounded-xl">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-base font-semibold text-center">
          Avatar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3 items-center flex flex-col">
        <Image
          src={currentAvatarUrl}
          alt={`${currentPlayer.name}'s current avatar`}
          width={80}
          height={80}
          className="rounded-full border-2 border-primary shadow-lg mb-3"
        />
        <Tabs defaultValue="style" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="parts" disabled={!styleCustomizations}>
              Parts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="style" className="mt-4 flex flex-col gap-2">
            {availableAvatarStyles.map((style) => (
              <Button
                key={style}
                variant={preferences.style === style ? "default" : "outline"}
                onClick={() => handleStyleChange(style)}
                className="w-full text-xs h-7"
                size="sm"
              >
                {
                  <Image
                    src={generateAvatarUrl({ style, seed: preferences.seed })}
                    alt={style}
                    width={20}
                    height={20}
                  />
                }
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </Button>
            ))}
          </TabsContent>
          <TabsContent value="parts" className="mt-2">
            <ScrollArea className="h-48">
              <div className="space-y-1 pr-2">
                {Object.keys(styleCustomizations).map((part) => (
                  <PartCustomizer
                    key={part}
                    part={part}
                    label={part.charAt(0).toUpperCase() + part.slice(1)}
                    styleCustomizations={styleCustomizations}
                    preferences={preferences}
                    handlePartChange={handlePartChange}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
