import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

// Runs synchronously in <head> before first paint so the correct theme
// attribute is on <html> before any CSS is applied. Must stay self-contained.
const noFlashScript = `(function(){var k='theme',a='data-theme',d=document.documentElement;function s(t){if(t==='light'||t==='dark')d.setAttribute(a,t);}var stored=null;try{stored=localStorage.getItem(k);}catch(e){try{stored=sessionStorage.getItem(k);}catch(e){}}var valid=stored==='light'||stored==='dark';if(stored&&!valid){try{localStorage.removeItem(k);}catch(e){try{sessionStorage.removeItem(k);}catch(e){}}}if(valid){s(stored);return;}var m=window.matchMedia('(prefers-color-scheme: dark)');var t=m.media==='(prefers-color-scheme: dark)'?(m.matches?'dark':'light'):'light';s(t);try{localStorage.setItem(k,t);}catch(e){try{sessionStorage.setItem(k,t);}catch(e){}}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GetChartered",
  description: "GetChartered Website - Master Professional Exams with Smart Practice Questions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
