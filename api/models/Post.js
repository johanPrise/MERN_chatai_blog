import mongoose from "mongoose";
const { Schema, model } = mongoose;

/**
 * The schema for a Post.
 * @typedef {Object} PostSchema
 * @property {string} title - The title of the post.
 * @property {string} summary - A summary of the post.
 * @property {string} content - The content of the post.
 * @property {string} cover - The cover image of the post.
 * @property {Schema.Types.ObjectId} author - The ID of the author of the post.
 * @property {Schema.Types.ObjectId} category - The ID of the category of the post.
 * @property {boolean} featured - Whether the post is featured or not.
 */

const PostSchema = new Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    cover: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    featured: { type: Boolean, default: false }, // Ajout du champ featured
  },
  {
    timestamps: true,
  },
);
/**
 * The model for a Post.
 * @type {mongoose.Model<PostSchema>}
 */
const PostModel = model("Post", PostSchema);
export default PostModel;

