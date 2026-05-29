// app/layout.js
import "./globals.css";
import PwaRegister from "./PwaRegister";
import Navbar from "./Navbar";

export const metadata = {
  title: "Phoenix XShare | Secure Hyper-Fast File Sharing",
  description: "Share your files securely with industrial-grade encryption, fast local/SFTP uploads, instant QR code distribution, and PWA capabilities.",
  manifest: "/site.webmanifest",
  appleMobileWebAppCapable: "yes",
  appleMobileWebAppStatusBarStyle: "black-translucent",
};

export const viewport = {
  themeColor: "#03060f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
      </head>
      <body>
        <PwaRegister />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
