import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
const http = httpRouter();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
http.route({ path: "/health", method: "GET", handler: httpAction(async () => json({ ok: true, service: "disposition-staging" })) });
http.route({ path: "/createDeal", method: "POST", handler: httpAction(async (ctx, request) => {
  const token = process.env.DISPOSITION_STAGING_TOKEN;
  if (!token || request.headers.get("Authorization") !== "Bearer " + token) return json({ success: false, error: "Unauthorized" }, 401);
  try {
    const deal = await request.json();
    const data = await ctx.runMutation(internal.staging.createDeal, deal);
    return json({ success: true, data });
  } catch {
    return json({ success: false, error: "Deal could not be staged" }, 400);
  }
}) });
http.route({
  path: "/getDeal",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const token = process.env.DISPOSITION_STAGING_TOKEN;
    if (!token || request.headers.get("Authorization") !== "Bearer " + token) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !("dealId" in body) ||
        typeof body.dealId !== "string" || !body.dealId.trim()) {
      return json({ success: false, error: "A dealId is required" }, 400);
    }

    const data = await ctx.runQuery(internal.staging.getDeal, { dealId: body.dealId });
    if (!data) return json({ success: false, error: "Staged deal not found" }, 404);
    return json({ success: true, data });
  }),
});
export default http;
