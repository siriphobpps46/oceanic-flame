import type { Metadata } from "next";
import { Geist, Geist_Mono, Anuphan } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Oceanic Flame | บันทึกรายรับ-รายจ่ายส่วนตัว",
  description: "แอปพลิเคชันบันทึกรายรับ-รายจ่ายส่วนบุคคลระดับพรีเมียมในแบบ Oceanic Flame มั่นคงประดุจผืนน้ำมหาสมุทร ตื่นตัวควบคุมค่าใช้จ่ายประดุจเปลวเพลิง ปลอดภัยและบันทึกข้อมูลในเครื่องของคุณ",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${anuphan.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-navy-950 dark:text-navy-50">
        {children}
      </body>
    </html>
  );
}

