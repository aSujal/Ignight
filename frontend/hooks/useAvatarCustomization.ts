import { AvatarPreferences } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

const AVATAR_STORAGE_KEY = 'ignight-avatar-preferences';

export function useAvatarCustomization(playerId: string, style: string) {
    const [preferences, setPreferences] = useState<AvatarPreferences>(() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(AVATAR_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            return {
              ...parsed,
              seed: playerId,
              style: parsed.style || style || 'micah',
            };
          } catch (e) {
            console.warn('Failed to parse stored avatar preferences');
          }
        }
      }
      return {
        style: style || 'micah',
        seed: playerId,
        customizations: {}
      };
    });

    useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(preferences));
      }
    }, [preferences]);


    const generateAvatarUrl = useCallback((config?: Partial<AvatarPreferences>) => {
        const finalConfig = { ...preferences, ...config };
        const params = new URLSearchParams();
      
        params.append('seed', finalConfig.seed);
      
        Object.entries(finalConfig.customizations).forEach(([key, value]) => {
            if (value) {
            params.append(key, value);
            }
        });
        console.log("params", params)
        console.log("config", config)
        const returnUrl = `https://api.dicebear.com/8.x/${finalConfig.style}/svg?${params.toString()}`
        console.log("returnUrl", returnUrl)
        return returnUrl;
    }, [preferences]);
  
    const updateStyle = useCallback((style: string) => {
      setPreferences(prev => ({
        ...prev,
        style,
        customizations: {} // Reset customizations when changing style
      }));
    }, []);
    
    const updateCustomization = useCallback((key: string, value: string) => {
      setPreferences(prev => ({
        ...prev,
        customizations: {
          ...prev.customizations,
          [key]: value
        }
      }));
    }, []);
   
    return {
      preferences,
      generateAvatarUrl,
      updateStyle,
      updateCustomization,
    };
  }