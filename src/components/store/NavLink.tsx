"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, exact, className, activeClassName, children, ...rest }: { href: string; exact?: boolean; className?: string; activeClassName?: string; children: React.ReactNode } & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={`${className ?? ""} ${active ? activeClassName ?? "" : ""}`} aria-current={active ? "page" : undefined} {...rest}>
      {children}
    </Link>
  );
}
