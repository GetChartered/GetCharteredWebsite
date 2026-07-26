import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export function PracticeBackLink() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto 16px" }}>
      <Link href="/practice" style={{ textDecoration: "none" }}>
        <Button variant="ghost" size="sm" leftIcon={ArrowLeft}>
          Back to Practice
        </Button>
      </Link>
    </div>
  );
}
