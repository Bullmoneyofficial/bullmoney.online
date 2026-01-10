import { ObjectId } from "mongodb";

export interface BlogHero {
  _id?: ObjectId;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Since this is just a TypeScript interface, we can't export it as default
// API routes should import as: import { BlogHero } from '@/models/BlogHero'
export default {} as any;
