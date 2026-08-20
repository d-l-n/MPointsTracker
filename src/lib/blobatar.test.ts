import { describe, expect, test } from "vitest";
import { getBlobatarUri, AVATAR_HUES, AVATAR_SHAPES } from "./blobatar";

describe("getBlobatarUri", () => {
  test("returns a data URI", () => {
    expect(getBlobatarUri("alice@test.com")).toMatch(/^data:image\/svg\+xml,/);
  });
  test("is deterministic per identifier", () => {
    expect(getBlobatarUri("alice@test.com")).toBe(getBlobatarUri("alice@test.com"));
  });
  test("differs across identifiers", () => {
    expect(getBlobatarUri("alice@test.com")).not.toBe(getBlobatarUri("bob@test.com"));
  });
  test("has no background by default", () => {
    expect(getBlobatarUri("alice@test.com")).not.toMatch(/squircle|background/);
  });
  test("accepts hue and traits options", () => {
    const uri = getBlobatarUri("alice@test.com", { hue: 210, traits: { shape: 0.965 } });
    expect(uri).toMatch(/^data:image\/svg\+xml,/);
    expect(uri).not.toBe(getBlobatarUri("alice@test.com"));
  });
});

describe("picker constants", () => {
  test("eight hues", () => { expect(AVATAR_HUES).toHaveLength(8); });
  test("ten shapes with midpoints in [0,1)", () => {
    expect(AVATAR_SHAPES).toHaveLength(10);
    for (const s of AVATAR_SHAPES) {
      expect(s.position).toBeGreaterThanOrEqual(0);
      expect(s.position).toBeLessThan(1);
    }
  });
  test("shape midpoints land in gen-2 bands", () => {
    const bands: [string, number, number][] = [
      ["round", 0, 0.22], ["organic", 0.22, 0.48], ["boxy", 0.48, 0.6],
      ["capsule", 0.6, 0.7], ["nub", 0.7, 0.79], ["cloud", 0.79, 0.86],
      ["droplet", 0.86, 0.915], ["hexagon", 0.915, 0.95], ["sun", 0.95, 0.98],
      ["triangle", 0.98, 1],
    ];
    for (let i = 0; i < AVATAR_SHAPES.length; i++) {
      const [name, lo, hi] = bands[i]!;
      expect(AVATAR_SHAPES[i]!.name).toBe(name);
      expect(AVATAR_SHAPES[i]!.position).toBeGreaterThanOrEqual(lo);
      expect(AVATAR_SHAPES[i]!.position).toBeLessThan(hi);
    }
  });
});
