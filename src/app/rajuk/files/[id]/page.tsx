"use client";

import { useParams } from "next/navigation";
import { ReviewWorkspace } from "@/features/rajuk/review";

export default function FileReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <ReviewWorkspace key={id} id={id} />;
}
