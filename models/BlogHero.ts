import mongoose, { Schema, model, models } from "mongoose";

const BlogHeroSchema = new Schema(
  {
    badge: { type: String, default: "BullMoney Blogs" },
    title: { type: String, default: "Latest Market Insights" },
    subtitle: { type: String, default: "Deep dives into crypto, forex, and trading psychology." },
    primaryCtaLabel: { type: String, default: "Read Articles" },
    secondaryCtaLabel: { type: String, default: "Subscribe" },
    featuredTitle: { type: String, default: "Featured Post" },
    featuredSubtitle: { type: String, default: "Don't miss our latest analysis." },
    featuredPriceLabel: { type: String, default: "New" }, // Reusing 'PriceLabel' for generic tag
    featuredTagLabel: { type: String, default: "Hot" },
    featuredNote: { type: String, default: "5 min read" },
    featuredImageUrl: { type: String, default: "https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg" },
  },
  { timestamps: true }
);

const BlogHero = models.BlogHero || model("BlogHero", BlogHeroSchema);

export default BlogHero;