import { describe, expect, it } from "vitest";
import { cleanNationalNumber, COUNTRIES, COUNTRY_OPTIONS, countryByIso, DEFAULT_COUNTRY, flagOf, fromInternational, INTERNATIONAL_PHONE, phoneProblem, toInternational } from "@shared/phone";

describe("the country list", () => {
  it("defaults to Nigeria and lists it first, then the likeliest countries, then everyone else once", () => {
    expect(DEFAULT_COUNTRY).toBe("NG");
    expect(COUNTRY_OPTIONS.slice(0, 5).map((country) => country.iso)).toEqual(["NG", "GH", "KE", "ZA", "GB"]);
    expect(new Set(COUNTRY_OPTIONS.map((country) => country.iso)).size).toBe(COUNTRIES.length);
    expect(COUNTRY_OPTIONS).toHaveLength(COUNTRIES.length);
    for (const country of COUNTRIES) {
      expect(country.iso, country.name).toMatch(/^[A-Z]{2}$/);
      expect(country.dial, country.name).toMatch(/^[1-9]\d{0,3}$/);
    }
    expect(countryByIso("NG")).toEqual({ iso: "NG", name: "Nigeria", dial: "234" });
    expect(countryByIso("XX").iso).toBe("NG");
  });

  it("builds the flag from the ISO code", () => {
    expect(flagOf("NG")).toBe("🇳🇬");
    expect(flagOf("gb")).toBe("🇬🇧");
  });
});

describe("cleaning what the owner types", () => {
  it("keeps digits only and drops the local leading 0, saying it did", () => {
    expect(cleanNationalNumber("NG", "803 123 4567")).toEqual({ iso: "NG", national: "8031234567", droppedZero: false });
    expect(cleanNationalNumber("NG", "0803-123-4567")).toEqual({ iso: "NG", national: "8031234567", droppedZero: true });
    expect(cleanNationalNumber("GB", "07700 900123")).toEqual({ iso: "GB", national: "7700900123", droppedZero: true });
  });

  it("understands a pasted international number, including its country", () => {
    expect(cleanNationalNumber("NG", "+234 803 123 4567")).toMatchObject({ iso: "NG", national: "8031234567" });
    expect(cleanNationalNumber("NG", "+44 7700 900123")).toMatchObject({ iso: "GB", national: "7700900123" });
    expect(cleanNationalNumber("NG", "00233 24 123 4567")).toMatchObject({ iso: "GH", national: "241234567" });
    expect(cleanNationalNumber("NG", "2348031234567")).toMatchObject({ iso: "NG", national: "8031234567" });
  });

  it("keeps the chosen country when several share a calling code", () => {
    expect(cleanNationalNumber("CA", "+1 416 555 0100").iso).toBe("CA");
    expect(cleanNationalNumber("US", "+1 212 555 0100").iso).toBe("US");
  });

  it("keeps the leading 0 where it is part of the international number", () => {
    expect(cleanNationalNumber("IT", "06 1234 5678")).toMatchObject({ national: "0612345678", droppedZero: false });
  });
});

describe("checking and storing the number", () => {
  it("accepts Nigerian mobile numbers of 10 digits after +234, and an empty number", () => {
    for (const ok of ["8031234567", "7011234567", "9091234567", "8101234567", ""]) expect(phoneProblem("NG", ok), ok).toBeNull();
    for (const bad of ["803123456", "80312345678", "6031234567", "8231234567"]) expect(phoneProblem("NG", bad), bad).toMatch(/10 digits after \+234/);
  });

  it("uses a simple length check elsewhere", () => {
    expect(phoneProblem("GB", "7700900123")).toBeNull();
    expect(phoneProblem("GB", "12345")).toMatch(/too short or too long/);
  });

  it("stores the international format and reads it back", () => {
    expect(toInternational("NG", "8031234567")).toBe("+2348031234567");
    expect(toInternational("NG", "")).toBe("");
    expect(fromInternational("+2348031234567")).toEqual({ iso: "NG", national: "8031234567" });
    expect(fromInternational("+447700900123")).toEqual({ iso: "GB", national: "7700900123" });
    expect(fromInternational(null)).toEqual({ iso: "NG", national: "" });
    expect(INTERNATIONAL_PHONE.test("+2348031234567")).toBe(true);
    for (const bad of ["08031234567", "+0123456789", "+234 803", "+12345"]) expect(INTERNATIONAL_PHONE.test(bad), bad).toBe(false);
  });
});
