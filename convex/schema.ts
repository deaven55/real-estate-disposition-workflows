import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  stagingDeals: defineTable({ property_address: v.string(), address_normalized: v.string(), city: v.string(), state: v.string(), zip: v.string(), property_type: v.string(), beds: v.number(), baths: v.number(), sqft: v.number(), asking_price: v.number(), arv: v.number(), repair_estimate: v.number(), repair_scope: v.string(), margin: v.number(), deal_score: v.number(), best_strategy: v.string(), comp_confidence: v.string(), source_type: v.string(), photos: v.array(v.string()) }).index("by_address", ["state", "zip", "address_normalized"]),
  stagingMissedDeals: defineTable({
    buyerId: v.string(),
    market: v.string(),
    strategy: v.string(),
    minAskingPrice: v.number(),
    maxAskingPrice: v.number(),
    expiresAt: v.number(),
  }).index("by_market_strategy_expiration", ["market", "strategy", "expiresAt"]),
  stagingDistributions: defineTable({
    dealId: v.id("stagingDeals"),
    buyerId: v.string(),
    status: v.literal("ping_sent"),
    round: v.number(),
    templateId: v.string(),
    sentAt: v.number(),
    nextFollowUp: v.number(),
  }).index("by_deal_buyer_round", ["dealId", "buyerId", "round"]),
});
