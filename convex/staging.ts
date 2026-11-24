import { internalMutation } from "./_generated/server";
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
