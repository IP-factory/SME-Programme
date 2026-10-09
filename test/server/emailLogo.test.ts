import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMAIL_LOGO_PNG_BASE64, EMAIL_LOGO_SIZE } from "@server/emailLogo";

describe("the logo embedded in business support email", () => {
  const png = Buffer.from(EMAIL_LOGO_PNG_BASE64, "base64");

  it("is the same file as client/public/brand/ipf-gradient-logo-email.png", () => {
    const file = readFileSync(new URL("../../client/public/brand/ipf-gradient-logo-email.png", import.meta.url));
    expect(png.equals(file)).toBe(true);
  });

  it("is a PNG at twice the size it is shown, so it stays sharp on phones", () => {
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }).toEqual({ width: EMAIL_LOGO_SIZE.width * 2, height: 179 });
    expect(Math.round(png.readUInt32BE(20) / 2)).toBe(EMAIL_LOGO_SIZE.height);
  });
});
