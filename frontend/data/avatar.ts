export type AvatarStyle =
  | "micah"
  | "adventurer"
  | "shapes";

export const allAvatarOptions = {
  micah: {
    hair: [
      "fonze",
      "mrT",
      "mrClean",
      "turban",
      "pixie",
    ],
    hairColor: [
      "4a312c",
      "77311d",
      "a86450",
      "b58143",
      "c93305",
      "e5d7a3",
      "f59797",
      "6b4423",
    ],
    eyebrows: ["up", "down", "eyelashesUp", "eyelashesDown", "concerned"],
    eyes: ["eyes", "smiling", "round"],
    mouth: ["smile", "smirk", "laughing", "pucker", "surprised"],
    shirt: ["open", "crew", "collared"],
    shirtColor: ["92876b", "65c9ff", "545454", "e6e6e6", "ff5722"],
    skinColor: ["f2d5d5", "deb887", "a0522d", "8d5524", "6b4423"],
    backgroundColor: ["b6e3f4", "f5f5f5", "ffd54f", "ffdfbf", "d1d4f9"],
  },
  adventurer: {
    skinColor: ["f2d5d5", "deb887", "a0522d", "8d5524", "6b4423"],
    hair: [
      "short01",
      "short02",
      "short03",
      "short04",
      "short05",
      "long01",
      "long02",
      "long03",
    ],
    hairColor: ["4a312c", "77311d", "a86450", "b58143", "f59797", "e5d7a3"],
    eyes: [
      "variant01",
      "variant02",
      "variant03",
      "variant04",
      "variant05",
      "variant06",
    ],
    eyebrows: ["variant01", "variant02", "variant03", "variant04", "variant05"],
    mouth: [
      "variant01",
      "variant02",
      "variant03",
      "variant04",
      "variant05",
      "variant06",
    ],
    backgroundColor: ["b6e3f4", "f5f5f5", "ffd54f", "ffdfbf", "d1d4f9"],
  },
  shapes: {
    shapeColor: ["0a5b83", "1c799f", "69d2e7", "f1f4dc", "f88c4d"],
    backgroundColor: ["b6e3f4", "f5f5f5", "ffd54f", "ffdfbf", "d1d4f9"],
  },
};
