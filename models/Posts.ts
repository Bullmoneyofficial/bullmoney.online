import { ObjectId } from "mongodb";

export interface Post {
  _id?: ObjectId;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  tags?: string[];
  excerpt?: string;
  slug?: string;
}

// Since this is just a TypeScript interface, we can't export it as default
// API routes should import as: import { Post } from '@/models/Posts'
export default {} as any;
