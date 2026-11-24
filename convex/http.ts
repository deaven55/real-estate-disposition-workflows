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
export default http;
