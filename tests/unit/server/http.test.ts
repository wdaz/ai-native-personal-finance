import { describe, expect, it } from "vitest";
import { errorResponse, rateLimitedResponse, validationErrorResponse } from "@/src/server/http";
import type { ErrorEnvelope } from "@/src/shared/schemas";

describe("errorResponse", () => {
  it("carries the status, error and message, no issues or retryAfter", async () => {
    const response = errorResponse(401, "invalid_credentials", "Email or password is incorrect");
    expect(response.status).toBe(401);
    const body = (await response.json()) as ErrorEnvelope;
    expect(body).toEqual({ error: "invalid_credentials", message: "Email or password is incorrect" });
  });
});

describe("validationErrorResponse", () => {
  it("is always 400 validation with issues and no message", async () => {
    const response = validationErrorResponse([{ path: ["email"], code: "required" }]);
    expect(response.status).toBe(400);
    const body = (await response.json()) as ErrorEnvelope;
    expect(body).toEqual({ error: "validation", issues: [{ path: ["email"], code: "required" }] });
    expect(body.message).toBeUndefined();
  });
});

describe("rateLimitedResponse", () => {
  it("is 429 rate_limited with retryAfter in the body and the Retry-After header", async () => {
    const response = rateLimitedResponse("Too many attempts", 300);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("300");
    const body = (await response.json()) as ErrorEnvelope;
    expect(body).toEqual({ error: "rate_limited", message: "Too many attempts", retryAfter: 300 });
  });
});
