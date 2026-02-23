import "./globals.css";
import "../styles/_combined-layout.css";

export { metadata, viewport } from "./layout.metadata";

import RootLayoutImpl from "./RootLayout.impl";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return <RootLayoutImpl children={children} modal={modal} />;
}
