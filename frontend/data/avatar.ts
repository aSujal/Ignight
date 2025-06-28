import {
  micah as micahStyle,
  adventurer as adventurerStyle,
  shapes as shapesStyle,
} from "@dicebear/collection";

export type AvatarStyle = "micah" | "adventurer" | "shapes";

function extractOptions(styleSchema: any): Record<string, string[]> {
  const opts: Record<string, string[]> = {};
  Object.entries(styleSchema.properties).forEach(([key, s]: any) => {
    if (s.enum) opts[key] = s.enum;
    else if (s.items?.enum) opts[key] = s.items.enum;
  });
  return opts;
}

const micahColorOptions: Partial<Record<string, string[]>> = {
  baseColor: ['FCD5CE', 'F8EDEB', 'D8E2DC', 'ECE4DB', 'FFE5B4'],
  eyebrowsColor: ['5D3A00', '7A5230', '3E1F0D', '000000', 'B08968'],
  eyesColor: ['3E3E3E', '1E2A38', '7D5A50', '354259', '6D6875'],
  hairColor: ['000000', '5A3E36', 'D2B48C', 'B5651D', 'A0522D'],
  shirtColor: ['FFD6A5', 'FDFFB6', 'CAFFBF', '9BF6FF', 'A0C4FF'],
  backgroundColor: ['FFFFFF', 'F0F0F0', 'E0E0E0', 'D0D0D0', 'C0C0C0'],
};

const adventurerColorOptions: Partial<Record<string, string[]>> = {
  skinColor: ['FCD5CE', 'F8EDEB', 'D8E2DC', 'ECE4DB', 'FFE5B4'],
  hairColor: ['000000', '5A3E36', 'D2B48C', 'B5651D', 'A0522D'],
  backgroundColor: ['FFFFFF', 'F0F0F0', 'E0E0E0', 'D0D0D0', 'C0C0C0'],
};

const shapesColorOptions: Partial<Record<string, string[]>> = {
  backgroundColor: ['FFFFFF', 'F0F0F0', 'E0E0E0', 'D0D0D0', 'C0C0C0'],
  shape1Color: ['FCD5CE', 'F8EDEB', 'D8E2DC', 'ECE4DB', 'FFE5B4'],
  shape2Color: ['FCD5CE', 'F8EDEB', 'D8E2DC', 'ECE4DB', 'FFE5B4'],
  shape3Color: ['FCD5CE', 'F8EDEB', 'D8E2DC', 'ECE4DB', 'FFE5B4'],
};

export const allAvatarOptions = {
  micah: (() => {
    const base = extractOptions(micahStyle.schema);
    
    const unwantedParts = ['base', 'earrings', 'facialHair', "glasses"];
    for (const part of unwantedParts) delete base[part];

    // Custom color parts
    return {
      ...base,
      ...micahColorOptions,
    };
  })(),
  adventurer: (() => {
    const base = extractOptions(adventurerStyle.schema);
    
    const unwantedParts = ['base', 'earrings', 'facialHair', "glasses", "features"];
    for (const part of unwantedParts) delete base[part];

    // Custom color parts
    return {
      ...base,
      ...adventurerColorOptions,
    };
  })(),
  shapes: (() => {
    const base = extractOptions(shapesStyle.schema);
    
    const unwantedParts = ['base', 'earrings', 'facialHair'];
    for (const part of unwantedParts) delete base[part];

    // Custom color parts
    return {
      ...base,
      ...shapesColorOptions,
    };
  })(),
};