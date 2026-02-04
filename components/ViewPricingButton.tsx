"use client";

import { Button } from "@/components/ui";

export function ViewPricingButton() {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => {
        document.getElementById("pricing")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }}
    >
      View Pricing
    </Button>
  );
}
