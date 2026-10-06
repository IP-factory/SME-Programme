import { describe, expect, it } from "vitest";
import express from "express";
import { createServer } from "http";
import type { AddressInfo } from "net";
import { restoreOriginalUrl, createVercelGateway } from "./_core/vercelGateway";
import { createApp } from "./_core/app";

describe("restoreOriginalUrl", () => {
  it("rebuilds the original tRPC path", () => {
    expect(restoreOriginalUrl("/api/index?__prefix=api&__path=trpc/registration.submit")).toBe("/api/trpc/registration.submit");
  });

  it("preserves genuine query strings byte-for-byte", () => {
    const input = encodeURIComponent('{"0":{"json":null}}');
    expect(restoreOriginalUrl(`/api/index?__prefix=api&__path=trpc/a,b&batch=1&input=${input}`)).toBe(`/api/trpc/a,b?batch=1&input=${input}`);
  });

  it("drops Vercel's echoed path parameter but keeps a genuine one", () => {
    expect(restoreOriginalUrl("/api/index?__prefix=api&__path=trpc/x&path=trpc/x&a=1")).toBe("/api/trpc/x?a=1");
    expect(restoreOriginalUrl("/api/index?__prefix=api&__path=trpc/x&path=trpc/x&path=mine")).toBe("/api/trpc/x?path=mine");
  });

  it("restores non-api prefixes and bare prefixes", () => {
    expect(restoreOriginalUrl("/api/index?__prefix=portal&__path=authenticate")).toBe("/portal/authenticate");
    expect(restoreOriginalUrl("/api/index?__prefix=manus-storage&__path=participant-assignments/1/f.pdf")).toBe("/manus-storage/participant-assignments/1/f.pdf");
    expect(restoreOriginalUrl("/api/index?__prefix=api&__path=")).toBe("/api");
  });

  it("uses the first internal parameter so a visitor cannot override the rewrite", () => {
    expect(restoreOriginalUrl("/api/index?__prefix=api&__path=trpc/x&__prefix=portal&__path=y")).toBe("/api/trpc/x");
  });

  it("rejects unknown prefixes, traversal and backslashes", () => {
    expect(restoreOriginalUrl("/api/index?__prefix=admin&__path=x")).toBeNull();
    expect(restoreOriginalUrl("/api/index?__prefix=api&__path=../secret")).toBeNull();
    expect(restoreOriginalUrl("/api/index?__prefix=api&__path=a/%2e%2e/b")).toBeNull();
    expect(restoreOriginalUrl("/api/index?__prefix=api&__path=%5Cevil")).toBeNull();
    expect(restoreOriginalUrl("/api/index?__prefix=api&__path=%2Fevil.com")).toBe("/api/%2Fevil.com");
    expect(restoreOriginalUrl("/api/index")).toBeNull();
  });

  it("passes through an already-original URL and strips internal parameters", () => {
    expect(restoreOriginalUrl("/api/trpc/x?a=1")).toBe("/api/trpc/x?a=1");
    expect(restoreOriginalUrl("/elsewhere?a=1")).toBeNull();
  });
});

async function request(app: express.Express, path: string) {
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, { redirect: "manual" });
    return { status: res.status, location: res.headers.get("location"), body: await res.text() };
  } finally {
    server.close();
  }
}

describe("createApp and the Vercel gateway", () => {
  it("serves GET /api/health", async () => {
    const res = await request(createApp(), "/api/health");
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true, service: "ipfactory-sme" });
  });

  it("routes rewritten URLs to the original Express route", async () => {
    const gateway = createVercelGateway(createApp());
    const health = await request(gateway, "/api/index?__prefix=api&__path=health");
    expect(JSON.parse(health.body)).toEqual({ ok: true, service: "ipfactory-sme" });
    const portal = await request(gateway, "/api/index?__prefix=portal&__path=authenticate");
    expect(portal.status).toBe(302);
    expect(portal.location).toBe("/?participant_signin=1");
    expect((await request(gateway, "/api/index?__prefix=nope&__path=x")).status).toBe(404);
  });
});
