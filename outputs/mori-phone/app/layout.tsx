import type { Metadata } from "next";
import "./globals.css";
import "./refinement.css";
import "./comfort.css";
import "./settings.css";
import "./reference-sky.css";

export const metadata: Metadata = {
  title: "云朵小手机 · 我们的小小世界",
  description: "私人 AI 陪伴小手机，角色、聊天、一起听、记忆与日常工具。",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "云朵小手机", statusBarStyle: "default" },
  other: {
    "codex-preview": "development",
  },
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
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

