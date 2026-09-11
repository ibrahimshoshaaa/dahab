import type { Metadata } from "next"
import "./globals.css"
import { CartProvider } from "./context/CartContext"
import { FavoritesProvider } from "./context/FavoritesContext"

export const metadata: Metadata = {
  title: "DAHAB | دهب — عبايات وإكسسوارات",
  description: "دهب — عبايات مصرية وإكسسوارات",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <CartProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  )
}
