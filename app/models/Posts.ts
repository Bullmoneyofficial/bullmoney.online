import { Schema, model, models } from "mongoose";

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "Uncategorised",
    },
    visible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt
  }
);

// Prevent model overwrite error in Next.js hot reloading
const Post = models.Post || model("Post", PostSchema);

export default Post;