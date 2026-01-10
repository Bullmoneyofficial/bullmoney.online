import { Schema, model, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    visible: { type: Boolean, default: true },
    buyUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.Product || model("Product", ProductSchema);
