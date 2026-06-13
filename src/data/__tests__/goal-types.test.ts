import { describe, expect, it } from "vitest";
import { Plane } from "lucide-react";
import { GOAL_TYPES, getGoalType, goalTypeIcon, PRESET_AMOUNTS } from "../goal-types";

describe("getGoalType", () => {
  it("returns matching goal type for known id", () => {
    const travel = getGoalType("travel");
    expect(travel.id).toBe("travel");
    expect(travel.label).toBe("旅行");
  });

  it("returns all known goal types", () => {
    expect(getGoalType("house").label).toBe("买房");
    expect(getGoalType("car").label).toBe("买车");
    expect(getGoalType("shopping").label).toBe("购物");
    expect(getGoalType("custom").label).toBe("自定义");
  });

  it("falls back to custom for unknown id", () => {
    const result = getGoalType("nonexistent");
    expect(result.id).toBe("custom");
    expect(result.label).toBe("自定义");
  });

  it("falls back to custom for empty string", () => {
    const result = getGoalType("");
    expect(result.id).toBe("custom");
  });
});

describe("goalTypeIcon", () => {
  it("returns the correct icon for a known type", () => {
    expect(goalTypeIcon("travel")).toBe(Plane);
  });

  it("returns custom icon for unknown type", () => {
    const customType = getGoalType("custom");
    expect(goalTypeIcon("unknown")).toBe(customType.icon);
  });
});

describe("PRESET_AMOUNTS", () => {
  it("contains the expected preset values", () => {
    expect([...PRESET_AMOUNTS]).toEqual([1000, 5000, 10000, 30000, 50000, 100000]);
  });

  it("has 6 entries", () => {
    expect(PRESET_AMOUNTS).toHaveLength(6);
  });
});

describe("GOAL_TYPES", () => {
  it("has 5 goal types defined", () => {
    expect(GOAL_TYPES).toHaveLength(5);
  });

  it("last entry is custom with no fields", () => {
    const custom = GOAL_TYPES[GOAL_TYPES.length - 1];
    expect(custom.id).toBe("custom");
    expect(custom.fields).toEqual([]);
  });
});
