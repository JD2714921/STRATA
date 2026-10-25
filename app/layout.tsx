import type { Metadata } from "next";
import "./v2.css";
import "./fonts.css";

export const metadata: Metadata = {
  title: "STRATA — Global intelligence",
  description: "Private market and portfolio review built around Elastication Three Circles, inspectable evidence and J’s decisions.",
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
