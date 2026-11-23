import Image from "next/image";
import { artSvg } from "./productArt";
import styles from "./ProductVisual.module.css";

type Props = {
  artKey?: string | null;
  imageUrl?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "fill";
  priority?: boolean;
  className?: string;
};

/** Real photography when uploaded; otherwise the palette illustration fallback. */
export function ProductVisual({ artKey, imageUrl, alt, size = "md", priority, className }: Props) {
  const cls = `${styles.visual} ${styles[size]} ${className ?? ""}`;
  if (imageUrl) {
    return (
      <span className={cls}>
        <Image src={imageUrl} alt={alt} fill sizes={size === "lg" || size === "fill" ? "(max-width: 900px) 100vw, 50vw" : "160px"} priority={priority} className={styles.img} />
      </span>
    );
  }
  return <span className={cls} role="img" aria-label={alt} dangerouslySetInnerHTML={{ __html: artSvg(artKey, size === "fill") }} />;
}
