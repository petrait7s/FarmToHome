"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/guards";
import { cuid } from "@/lib/validation";

export async function toggleFavorite(formData: FormData): Promise<void> {
  const user = await requireUser();
  const productId = cuid.parse(formData.get("productId"));
  const existing = await db.favorite.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
  if (existing) await db.favorite.delete({ where: { userId_productId: { userId: user.id, productId } } });
  else await db.favorite.create({ data: { userId: user.id, productId } });
  const slug = String(formData.get("slug") ?? "");
  if (slug) revalidatePath(`/products/${slug}`);
  revalidatePath("/account/favorites");
}
