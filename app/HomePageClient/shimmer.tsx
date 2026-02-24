// ============================================================
// HomePageClient — Inline Shimmer Components
//
// ✅ SHIMMER: Only 2 of 7 exports from the full shimmer module were
// used — inlined here instead of importing the 1,561-line module.
// Eliminated: ShimmerBorder, ShimmerLine, ShimmerDot, ShimmerFloat,
// ShimmerContainer (all unused).
// ============================================================

export const ShimmerSpinner = ({
  size = 48,
  color = "white",
}: {
  size?: number;
  color?: string;
}) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid ${color}33`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "bm-spin 0.8s linear infinite",
    }}
  />
);

export const ShimmerRadialGlow = ({
  color = "white",
  intensity = "low",
}: {
  color?: string;
  intensity?: string;
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(circle, ${color}${
        intensity === "low" ? "0a" : "1a"
      } 0%, transparent 70%)`,
    }}
  />
);
