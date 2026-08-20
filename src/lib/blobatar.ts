import { blobatarUri } from "blobatar/uri";
import type { BlobatarOptions } from "blobatar";

export function getBlobatarUri(identifier: string, options?: BlobatarOptions): string {
  return blobatarUri(identifier, options);
}

export const AVATAR_HUES = [12, 56, 100, 144, 188, 232, 276, 320];

export const AVATAR_SHAPES: { name: string; position: number }[] = [
  { name: "round", position: 0.11 },
  { name: "organic", position: 0.35 },
  { name: "boxy", position: 0.54 },
  { name: "capsule", position: 0.65 },
  { name: "nub", position: 0.745 },
  { name: "cloud", position: 0.825 },
  { name: "droplet", position: 0.8875 },
  { name: "hexagon", position: 0.9325 },
  { name: "sun", position: 0.965 },
  { name: "triangle", position: 0.99 },
];
