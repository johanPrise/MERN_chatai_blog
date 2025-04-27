import { Types } from 'mongoose';

export interface IComment {
  content: string;
  author: Types.ObjectId;
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  post: Types.ObjectId;
}