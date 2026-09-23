import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OriginTrialMeta } from "@/src/ui/OriginTrialMeta";

describe("OriginTrialMeta (SPEC-app-shell §2.1)", () => {
  it("renders Chrome's origin-trial tag with the token", () => {
    const html = renderToStaticMarkup(<OriginTrialMeta token="Aq1+/=" />);
    expect(html).toContain('<meta http-equiv="origin-trial"');
    expect(html).toContain('content="Aq1+/="');
  });

  it("renders nothing without a token", () => {
    expect(renderToStaticMarkup(<OriginTrialMeta token={null} />)).toBe("");
  });
});
