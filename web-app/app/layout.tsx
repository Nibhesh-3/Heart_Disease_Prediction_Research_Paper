import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import GoogleWrapper from "./components/GoogleWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auralis | Cardiovascular Diagnostics",
  description: "AI-powered clinical telemetry and cardiovascular risk prediction platform.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} h-full antialiased`}
    >
      {/* Anti-flash: apply theme before React hydrates */}
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('auralis_theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        {/* Guard against MetaMask / Web3 browser extension crashes */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(typeof window.ethereum==='undefined'){Object.defineProperty(window,'ethereum',{get:function(){return undefined;},set:function(){},configurable:true});}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.className} font-sans min-h-full flex flex-col bg-[#F8F9FA] dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 overflow-x-hidden transition-colors duration-200`}
      >
        <GoogleWrapper>
          <ThemeProvider>{children}</ThemeProvider>
        </GoogleWrapper>
      </body>
    </html>
  );
}
