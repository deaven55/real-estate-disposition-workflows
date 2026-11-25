const json = (body, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});

const stringFields = ["address", "city", "state", "zip", "propertyType", "repairScope", "source"];
const propertyTypes = ["SFR", "Duplex", "Multi", "Land", "Commercial"];
const conditionScores = new Map([["Light", 90], ["Medium", 70], ["Heavy", 40], ["Gut", 20]]);
const compScores = new Map([["High", 100], ["Medium", 60], ["Low", 30]]);
const suffixes = { st: "street", ave: "avenue", dr: "drive", rd: "road", blvd: "boulevard", ln: "lane", ct: "court", cir: "circle", pl: "place" };

function prepareDeal(input) {
  const deal = { ...input };
  const errors = [];
  for (const field of stringFields) {
    deal[field] = typeof deal[field] === "string" ? deal[field].trim() : "";
    if (!deal[field]) errors.push(`Missing required field: ${field}`);
  }
  for (const field of ["askingPrice", "arv", "repairEstimate", "beds", "baths", "sqft"]) {
    const optional = ["beds", "baths", "sqft"].includes(field);
    const value = deal[field] ?? (optional ? 0 : undefined);
    deal[field] = typeof value === "string" && value.trim() ? Number(value) : value;
    if (!Number.isFinite(deal[field]) || deal[field] < 0) errors.push(`Invalid number: ${field}`);
  }
  if (deal.askingPrice <= 0) errors.push("askingPrice must be > 0");
  if (deal.arv <= deal.askingPrice) errors.push("arv must be > askingPrice");
  if (deal.propertyType && !propertyTypes.includes(deal.propertyType)) errors.push("Invalid propertyType");
  if (deal.repairScope && !conditionScores.has(deal.repairScope)) errors.push("Invalid repairScope");
  const normalized = deal.address.toLowerCase()
    .replace(/ (st|ave|dr|rd|blvd|ln|ct|cir|pl)(?= |$)/g, (_, suffix) => " " + suffixes[suffix])
    .replace(/[.,#]/g, "").replace(/\s+(apt|unit|suite|ste|#)\s*\S*/gi, "")
    .replace(/\s+/g, " ").trim();
  if (!normalized && deal.address) errors.push("Invalid address");
  if (errors.length) return { errors };

  const margin = ((deal.arv - deal.askingPrice - deal.repairEstimate) / deal.arv) * 100;
  if (!Number.isFinite(margin)) return { errors: ["Invalid deal margin"] };
  const confidence = typeof deal.compConfidence === "string" && deal.compConfidence || "Medium";
  const score = Math.round(Math.min(Math.max(margin / 40 * 100, 0), 100) * 0.30
    + 50 * 0.20 + 70 * 0.15 + conditionScores.get(deal.repairScope) * 0.15
    + (compScores.get(confidence) ?? 60) * 0.10 + 100 * 0.10);
  let strategy = "Wholesale";
  if (margin >= 25 && ["Light", "Medium"].includes(deal.repairScope)) strategy = "Flip";
  else if (margin >= 20 && ["Medium", "Heavy"].includes(deal.repairScope)) strategy = "BRRRR";
  else if (margin >= 15) strategy = "Rental";

  const state = deal.state.toUpperCase();
  return {
    property_address: `${deal.address}, ${deal.city}, ${state} ${deal.zip}`,
    address_normalized: normalized,
    city: deal.city, state, zip: deal.zip, property_type: deal.propertyType,
    beds: deal.beds, baths: deal.baths, sqft: deal.sqft,
    asking_price: deal.askingPrice, arv: deal.arv,
    repair_estimate: deal.repairEstimate, repair_scope: deal.repairScope,
    margin: Math.round(margin * 10) / 10, deal_score: score, best_strategy: strategy,
    comp_confidence: confidence, source_type: deal.source,
    photos: typeof deal.driveLink === "string" && deal.driveLink.trim() ? [deal.driveLink.trim()] : [],
  };
}

async function post(url, token, body) {
  try {
    const response = await fetch(url, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (response.ok) return await response.json();
  } catch {
    // Upstream errors are intentionally kept out of the public response.
  }
  return null;
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/health" && request.method === "GET") return json({ ok: true });
    if (path !== "/intake") return json({ success: false, error: "Not found" }, 404);
    if (request.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);
    if (!env.INTAKE_TOKEN || !env.CONVEX_STAGING_TOKEN) {
      return json({ success: false, error: "Intake is not configured" }, 503);
    }
    if (request.headers.get("Authorization") !== `Bearer ${env.INTAKE_TOKEN}`) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const input = await request.json().catch(() => null);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return json({ success: false, error: "Expected a JSON object" }, 400);
    }
    const deal = prepareDeal(input);
    if (deal.errors) return json({ success: false, errors: deal.errors }, 400);

    const stored = await post(
      "https://enduring-mouse-862.convex.site/createDeal", env.CONVEX_STAGING_TOKEN, deal,
    );
    if (stored?.success !== true || typeof stored.data?._id !== "string") {
      return json({ success: false, error: "Convex did not confirm storage" }, 502);
    }

    let alert = "disabled";
    if (env.SLACK_BOT_TOKEN && env.SLACK_CHANNEL_ID) {
      const address = input.address.trim().replace(/[&<>]/g, symbol =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[symbol]);
      const result = await post("https://slack.com/api/chat.postMessage", env.SLACK_BOT_TOKEN, {
        channel: env.SLACK_CHANNEL_ID,
        text: `🏠 New WholeStack deal: ${address} | Score: ${deal.deal_score}/100 | $${deal.asking_price} | ${deal.margin}% margin | ${deal.best_strategy}`,
        mrkdwn: false, unfurl_links: false, unfurl_media: false,
      });
      alert = result?.ok === true ? "sent" : "unconfirmed";
    }
    return json({
      success: true, dealId: stored.data._id, dealScore: deal.deal_score,
      margin: deal.margin, bestStrategy: deal.best_strategy, status: "ready", alert,
    });
  },
};
