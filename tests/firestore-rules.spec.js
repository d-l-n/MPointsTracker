import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const rules = readFileSync("firestore.rules", "utf8");

test.describe("firestore rules", () => {
  test("admin access uses custom claims", () => {
    expect(rules).toMatch(/function isAdmin\(\) \{[\s\S]*request\.auth\.token\.admin == true/);
    expect(rules).not.toMatch(/request\.auth\.uid == "5UpEw50cQXcNnZQS4i7AaDQzY7J2"/);
  });

  test("users writes are limited to public profile fields", () => {
    expect(rules).toMatch(/match \/users\/\{userId\}[\s\S]*request\.resource\.data\.keys\(\)\.hasOnly\(\[\s*"displayName",\s*"searchName",\s*"photoURL",\s*"lastLogin",\s*"publicStats",\s*"statsUpdatedAt"\s*\]\)/);
  });

  test("invites support owner replacement without opening deletes globally", () => {
    expect(rules).toMatch(/match \/invites\/\{code\}[\s\S]*allow read:\s*if resource\.data\.expiresAt is int\s*&& resource\.data\.expiresAt > request\.time\.toMillis\(\)/);
    expect(rules).toMatch(/match \/invites\/\{code\}[\s\S]*allow create:\s*if isAuth\(\)[\s\S]*"uid", "displayName", "photoURL", "createdAt", "expiresAt"[\s\S]*request\.resource\.data\.uid == request\.auth\.uid/);
    expect(rules).toMatch(/match \/invites\/\{code\}[\s\S]*allow delete:\s*if isAdmin\(\) \|\| \(isAuth\(\) && resource\.data\.uid == request\.auth\.uid\)/);
  });
});
