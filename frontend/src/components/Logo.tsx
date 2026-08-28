import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number | string;
  title?: string;
}

export const Logo = ({ className, size = 36, title = "Blend" }: LogoProps) => {
  const dimension = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      className={cn("blend-mark", className)}
      width={dimension}
      height={dimension}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="48" height="48" rx="15" fill="#171713" />
      <path
        d="M23.5 9.5c-8.1 0-14 5.9-14 14.5s5.9 14.5 14 14.5v-8.1c-3.6 0-6-2.6-6-6.4s2.4-6.4 6-6.4V9.5Z"
        fill="#D8FF6B"
      />
      <path
        d="M24.5 9.5c8.1 0 14 5.9 14 14.5s-5.9 14.5-14 14.5v-8.1c3.6 0 6-2.6 6-6.4s-2.4-6.4-6-6.4V9.5Z"
        fill="#7A83FF"
      />
      <path d="M20.25 20.5h7.5v7h-7.5z" fill="#FF8066" />
    </svg>
  );
};
