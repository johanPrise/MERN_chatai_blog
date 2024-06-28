// models/Comment.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const CommentSchema = new Schema({
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Ajout du champ likes
    dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Ajout du champ dislikes

}, {
  timestamps: true,
});

const CommentModel = model("Comment", CommentSchema);
export default CommentModel;