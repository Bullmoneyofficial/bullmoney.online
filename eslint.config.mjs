import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      "Bullcasino/**",
      "casino-backend/**",
      "**/*.min.js",
      "ENHANCED_SETTINGS_MODAL.tsx",
      "CASINO_PAGE_EXAMPLES.tsx",
      "COMPLETE_SECTION_EXAMPLE.tsx",
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/component-hook-factories": "off",
      "react-hooks/config": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/gating": "off",
      "react-hooks/globals": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/static-components": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/use-memo": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-sync-scripts": "off",
      "import/no-anonymous-default-export": "off",
      "jsx-a11y/alt-text": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];
