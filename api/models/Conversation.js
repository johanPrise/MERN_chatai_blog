import mongoose from "mongoose";

const { Schema, model } = mongoose;
 

/**
 * Schema for a conversation.
 * @typedef {Object} ConversationSchema
 * @property {Schema.Types.ObjectId} [userId] - The user's ID.
 * @property {boolean} [isUserRegistered=false] - Whether the user is registered.
 * @property {Array<Object>} messages - The messages in the conversation.
 * @property {string} messages[].sender - The sender of the message.
 * @property {string} messages[].content - The content of the message.
 * @property {Date} messages[].timestamp - The timestamp of the message.
 */
const ConversationSchema = new Schema(
  {
    /** The user's ID. */
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    /** Whether the user is registered. Default is false. */
    isUserRegistered: { type: Boolean, default: false },
    /** The messages in the conversation. */
    messages: [
      {
        /** The sender of the message. */
        sender: { type: String, enum: ['user', 'model'], required: true },
        /** The content of the message. */
        content: { type: String, required: true },
        /** The timestamp of the message. Default is the current date and time. */
        timestamp: { type: Date, default: Date.now },
      }
    ]
  },
  { timestamps: true }
);

/**
 * Model for a conversation.
 * @type {Model<Conversation>}
 */
const ConversationModel = model("Conversation", ConversationSchema);

export default ConversationModel
