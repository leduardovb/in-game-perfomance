import { describe, expect, it } from "vitest";
import { LOL_ROLES } from "@/lib/games";
import { getTemplate, listLolTemplates, totalDurationMinutes } from "./templates";

describe("templates", () => {
  const all = [...listLolTemplates(), getTemplate("cs2", null)];

  it("has one LoL template per role and defaults to mid", () => {
    expect(listLolTemplates().map((template) => template.role).sort()).toEqual([...LOL_ROLES].sort());
    expect(getTemplate("lol", null).role).toBe("mid");
  });

  it.each(all.map((template) => [template.id, template] as const))("%s lasts one hour", (_, template) => {
    expect(totalDurationMinutes(template)).toBe(60);
  });

  it.each(all.map((template) => [template.id, template] as const))("%s has unique step ids", (_, template) => {
    const ids = template.steps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ignores the role for CS2", () => {
    expect(getTemplate("cs2", "mid").role).toBeNull();
  });
});
