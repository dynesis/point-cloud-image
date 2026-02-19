export interface ImagePair {
  color: string;
  depth: string;
}

export const IMAGE_PAIRS: ImagePair[] = [
  { color: "/images/header-bg-1.png", depth: "/images/header-bg-1-zdepth.png" },
  { color: "/images/header-bg-2.png", depth: "/images/header-bg-2-zdepth.png" },
  { color: "/images/header-bg-3.png", depth: "/images/header-bg-3-zdepth.png" },
];

export function getSlideRoute(index: number): string {
  if (index === 0) return "/";
  return `/${index + 1}`;
}
