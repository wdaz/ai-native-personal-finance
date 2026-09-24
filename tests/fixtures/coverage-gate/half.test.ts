import { expect, test } from "vitest";
import { covered } from "./src/domain/half";

test("covers one of three functions", () => {
  expect(covered()).toBe(1);
});
