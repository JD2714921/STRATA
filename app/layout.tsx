import type { Metadata } from "next";
import "./v2.css";
import "./fonts.css";

export const metadata: Metadata = {
  title: "STRATA — Trading intelligence",
  description: "Private market review. The current decision, Elastication evidence, three circles and stand-down reasons stay visible before any research navigation.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
