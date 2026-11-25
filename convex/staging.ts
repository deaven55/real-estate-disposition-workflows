import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
export const createDeal = internalMutation({
  args: { property_address: v.string(), address_normalized: v.string(), city: v.string(), state: v.string(), zip: v.string(), property_type: v.string(), beds: v.number(), baths: v.number(), sqft: v.number(), asking_price: v.number(), arv: v.number(), repair_estimate: v.number(), repair_scope: v.string(), margin: v.number(), deal_score: v.number(), best_strategy: v.string(), comp_confidence: v.string(), source_type: v.string(), photos: v.array(v.string()) },
  handler: async (ctx, deal) => {
    if (!deal.property_address.trim() || !deal.address_normalized.trim() || deal.asking_price <= 0 || deal.arv <= deal.asking_price || deal.repair_estimate < 0 || deal.deal_score < 0 || deal.deal_score > 100 || Object.values(deal).some(x => typeof x === "number" && !Number.isFinite(x))) throw new Error("Invalid deal");
    const existing = await ctx.db.query("stagingDeals").withIndex("by_address", q => q.eq("state", deal.state).eq("zip", deal.zip).eq("address_normalized", deal.address_normalized)).first();
    if (existing) return existing;
    const id = await ctx.db.insert("stagingDeals", deal);
    return await ctx.db.get(id);
  },
});

export const getDeal = internalQuery({
  args: { dealId: v.string() },
  handler: async (ctx, { dealId }) => {
    const id = ctx.db.normalizeId("stagingDeals", dealId);
    if (!id) return null;

    const deal = await ctx.db.get(id);
    if (!deal) return null;

    return {
      _id: deal._id,
      status: "staged",
      address: deal.property_address,
      city: deal.city,
      state: deal.state,
      zip: deal.zip,
      propertyType: deal.property_type,
      askingPrice: deal.asking_price,
      arv: deal.arv,
      repairEstimate: deal.repair_estimate,
      repairScope: deal.repair_scope,
      dealScore: deal.deal_score,
      margin: deal.margin,
      bestStrategy: deal.best_strategy,
    };
  },
});

export const getMissedDealsByMarket = internalQuery({
  args: { market: v.string(), strategy: v.string(), askingPrice: v.number(), currentTime: v.number() },
  handler: async (ctx, args) => {
    const market = args.market.trim();
    const strategy = args.strategy.trim();
    if (!market || !strategy || !Number.isFinite(args.askingPrice) || args.askingPrice <= 0 ||
        !Number.isFinite(args.currentTime)) return null;

    const entries = await ctx.db.query("stagingMissedDeals")
      .withIndex("by_market_strategy_expiration", q =>
        q.eq("market", market).eq("strategy", strategy)
          .gt("expiresAt", Math.max(args.currentTime, Date.now())),
      )
      .filter(q => q.and(
        q.lte(q.field("minAskingPrice"), args.askingPrice),
        q.gte(q.field("maxAskingPrice"), args.askingPrice),
      ))
      .take(200);

    return [...new Set(entries.map(entry => entry.buyerId))].map(buyerId => ({ buyerId }));
  },
});

export const createDistribution = internalMutation({
  args: {
    dealId: v.string(),
    buyerId: v.string(),
    status: v.literal("ping_sent"),
    round: v.number(),
    templateId: v.string(),
    sentAt: v.number(),
    nextFollowUp: v.number(),
  },
  handler: async (ctx, args) => {
    const dealId = ctx.db.normalizeId("stagingDeals", args.dealId);
    if (!dealId || !(await ctx.db.get(dealId))) return { outcome: "missing_deal" as const };
    const buyerId = args.buyerId.trim();
    if (!buyerId || !args.templateId.trim() || !Number.isSafeInteger(args.round) ||
        args.round < 1 || !Number.isFinite(args.sentAt) || args.sentAt <= 0 ||
        !Number.isFinite(args.nextFollowUp) || args.nextFollowUp < args.sentAt) {
      return { outcome: "invalid" as const };
    }

    const existing = await ctx.db.query("stagingDistributions")
      .withIndex("by_deal_buyer_round", q =>
        q.eq("dealId", dealId).eq("buyerId", buyerId).eq("round", args.round),
      )
      .unique();
    if (existing) return { outcome: "stored" as const, id: existing._id };

    const id = await ctx.db.insert("stagingDistributions", { ...args, dealId, buyerId });
    return { outcome: "stored" as const, id };
  },
});
