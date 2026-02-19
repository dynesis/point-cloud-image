import { notFound } from "next/navigation";
import PointCloudPage from "@/components/PointCloudPage";
import { IMAGE_PAIRS } from "@/lib/slides";

export function generateStaticParams() {
  return IMAGE_PAIRS.slice(1).map((_, i) => ({ id: String(i + 2) }));
}

export default async function SlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const index = parseInt(id, 10) - 1;

  if (isNaN(index) || index < 1 || index >= IMAGE_PAIRS.length) {
    notFound();
  }

  return <PointCloudPage key={index} slideIndex={index} />;
}
