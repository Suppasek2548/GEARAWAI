import type { Database } from "@/types/database.types";

export type MediaCategory = Database["public"]["Enums"]["media_category"];
export const MEDIA_CATEGORIES: MediaCategory[] = [
  "product",
  "banner",
  "promotion",
  "category",
  "gallery",
  "team",
  "service",
  "reward",
  "other",
];

export type MediaItem = {
  id: string;
  url: string;
  fileName: string;
  category: MediaCategory;
  alt: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  createdAt: string;
};
