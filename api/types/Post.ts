import { Types } from 'mongoose';

export interface IPost {
  title: string;
  summary: string;
  content: string;
  author: Types.ObjectId;
  featured: boolean;
  likes: Types.ObjectId[] | null;
  dislikes: Types.ObjectId[] | null;
  createdAt: Date;
  updatedAt: Date;
  category?: Types.ObjectId | null;
  cover?: string | null;
  featuredImage?: string | null;
  comments?: Types.ObjectId[] | null;
}