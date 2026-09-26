import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneDesk AI | Enterprise Worksuite",
  description: "Unified AI Assistant powered by multi-domain classification and human-in-the-loop action execution across IT, HR, Finance, and Facilities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
