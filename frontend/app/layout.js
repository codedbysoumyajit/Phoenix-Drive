import "./globals.css";
import PwaRegister from "./PwaRegister";
import Navbar from "./Navbar";

const isPwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === "true";

export const metadata = {
  title: "Phoenix Drive | Fast & Secure Cloud Storage",
  description:
    "Share files securely with encryption, fast uploads, QR codes, and more.",
  appleMobileWebAppCapable: "yes",
  appleMobileWebAppStatusBarStyle: "black-translucent",
};

export const viewport = {
  themeColor: "#0c0f17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        {/* Anti-flash blocking theme script */}
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          })();
        `}} />
      </head>
      <body className="bg-slate-50 dark:bg-[#0c0f17] text-slate-900 dark:text-slate-100 font-sans min-h-screen antialiased transition-colors duration-300 flex flex-col">
        {isPwaEnabled ? <PwaRegister /> : null}
        <Navbar />
        {children}
      </body>
    </html>
  );
}
