import { Suspense } from "react";
import { ReviewSession } from "@/components/review-session";

export default function ReviewPage() {
  // useSearchParams cần Suspense khi build
  return <Suspense><ReviewSession /></Suspense>;
}
