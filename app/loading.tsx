import { BrandedLoader } from "@/components/BrandedLoader";

// Route-level loading boundary (shown during page navigation). Every other
// BrandedLoader usage in this codebase wraps it in a centered container --
// this one didn't, so it rendered flush at the top of the viewport instead
// of vertically centered like the rest of the site.
export default function Loading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <BrandedLoader />
    </div>
  );
}
