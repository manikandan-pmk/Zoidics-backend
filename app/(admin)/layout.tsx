import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Zoidics Admin",
    template: "%s | Zoidics Admin",
  },
  description: "Zoidics Admin Dashboard",
  icons: {
    icon: "/Z_logo.png",
    shortcut: "/Z_logo.png",
    apple: "/Z_logo.png",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}