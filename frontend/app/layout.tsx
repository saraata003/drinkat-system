import "./globals.css";

export const metadata = {
  title: "Drinkat Loyalty",
  description: "Drinkat Loyalty UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar">
      <body>{children}</body>
    </html>
  );
}