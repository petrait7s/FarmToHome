import Image from "next/image";
import { artSvg } from "./productArt";
import { photoForArt } from "@/lib/media";
import styles from "./ProductVisual.module.css";

type Props = {
  artKey?: string | null;
  imageUrl?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "fill";
  priority?: boolean;
  className?: string;
};

/**
 * Uploaded photography first; then an illustrative stock photo for the product type
 * (preview only, see src/lib/media.ts); otherwise the drawn illustration.
 */
export function ProductVisual({ artKey, imageUrl, alt, size = "md", priority, className }: Props) {
  const cls = `${styles.visual} ${styles[size]} ${className ?? ""}`;
  const src = imageUrl ?? photoForArt(artKey)?.src;
  if (src) {
    return (
      <span className={cls}>
        <Image src={src} alt={alt} fill sizes={size === "lg" || size === "fill" ? "(max-width: 640px) 70vw, (max-width: 1100px) 45vw, 30vw" : "96px"} priority={priority} className={styles.img} />
      </span>
    );
  }
  return <span className={cls} role="img" aria-label={alt} dangerouslySetInnerHTML={{ __html: artSvg(artKey, size === "fill") }} />;
}
