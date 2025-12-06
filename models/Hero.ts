import { Schema, model, models } from "mongoose";

const HeroSchema = new Schema(
  {
    badge: { type: String, default: "" },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    primaryCtaLabel: { type: String, default: "" },
    secondaryCtaLabel: { type: String, default: "" },
    featuredTitle: { type: String, default: "" },
    featuredSubtitle: { type: String, default: "" },
    featuredPriceLabel: { type: String, default: "" },
    featuredTagLabel: { type: String, default: "" },
    featuredNote: { type: String, default: "" },
    featuredImageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.Hero || model("Hero", HeroSchema);
