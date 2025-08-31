import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  type: 'user_registered' | 'post_published' | 'system_error' | 'user_activity' | 'content_moderation';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  metadata?: {
    userId?: string;
    postId?: string;
    username?: string;
    postTitle?: string;
    errorCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: true,
      enum: ['user_registered', 'post_published', 'system_error', 'user_activity', 'content_moderation'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    actionUrl: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      userId: {
        type: String,
        trim: true,
      },
      postId: {
        type: String,
        trim: true,
      },
      username: {
        type: String,
        trim: true,
      },
      postTitle: {
        type: String,
        trim: true,
      },
      errorCode: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances des requêtes
NotificationSchema.index({ timestamp: -1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);