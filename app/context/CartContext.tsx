"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Product } from "../data/products"
import { fetchProducts } from "../lib/api"

export type CartItem = Product & {
  quantity: number
  selectedColor?: string
  selectedSize?: string
}

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<CartItem>
  return typeof item.id === "number" && Number.isInteger(item.id) && item.id > 0 &&
    typeof item.slug === "string" && typeof item.name === "string" &&
    typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 &&
    typeof item.image === "string" &&
    Array.isArray(item.colors) && Array.isArray(item.sizes) &&
    typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 100
}

function sanitizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []
  return value.filter(isValidCartItem).map((item) => ({
    ...item,
    quantity: Math.min(100, Math.max(1, Math.floor(item.quantity))),
  }))
}

export function getCartItemStock(item: CartItem): number {
  if (item.variantStock && Object.keys(item.variantStock).length > 0) {
    const key = `${item.selectedColor || "-"}|${item.selectedSize || "-"}`
    return Math.max(0, Number(item.variantStock[key] ?? 0))
  }

  return Math.max(0, Number(item.stock ?? 0))
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (
    product: Product,
    quantity?: number,
    selectedColor?: string,
    selectedSize?: string
  ) => void
  removeFromCart: (id: number, color?: string, size?: string) => void
  clearCart: () => void
  updateQuantity: (
    id: number,
    quantity: number,
    color?: string,
    size?: string
  ) => void
  refreshCartStock: () => Promise<boolean>
  cartHasStockIssue: boolean
  stockChecking: boolean
  stockError: string
  cartCount: number
  cartTotal: number
  mounted: boolean
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [stockChecking, setStockChecking] = useState(false)
  const [stockError, setStockError] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("dahab-cart")

    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(sanitizeCart(JSON.parse(saved)))
      } catch {
        localStorage.removeItem("dahab-cart")
      }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem("dahab-cart", JSON.stringify(cart))
  }, [cart, mounted])

  async function refreshCartStock() {
    if (!mounted || cart.length === 0) {
      setStockError("")
      return true
    }

    setStockChecking(true)
    setStockError("")

    try {
      const products = await fetchProducts()
      const productMap = new Map(products.map((product) => [product.id, product]))

      setCart((current) =>
        current.map((item) => {
          const latest = productMap.get(item.id)
          if (!latest) return item

          const latestStock = getCartItemStock({
            ...item,
            stock: latest.stock,
            variantStock: latest.variantStock,
          })

          return {
            ...item,
            stock: latest.stock,
            variantStock: latest.variantStock,
            lowStockThreshold: latest.lowStockThreshold,
            quantity: latestStock > 0
              ? Math.min(item.quantity, latestStock)
              : item.quantity,
          }
        })
      )

      return true
    } catch {
      setStockError("تعذر التحقق من المخزون حاليًا. أعيدي المحاولة قبل إتمام الطلب.")
      return false
    } finally {
      setStockChecking(false)
    }
  }

  function addToCart(
    product: Product,
    quantity = 1,
    selectedColor?: string,
    selectedSize?: string
  ) {
    const availableStock = getCartItemStock({
      ...product,
      quantity: 1,
      selectedColor,
      selectedSize,
    })

    if (availableStock <= 0) return

    setCart((current) => {
      const existing = current.find(
        (item) =>
          item.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
      )

      if (existing) {
        return current.map((item) =>
          item === existing
            ? { ...item, quantity: Math.min(availableStock, item.quantity + quantity) }
            : item
        )
      }

      return [
        ...current,
        {
          ...product,
          quantity: Math.min(availableStock, Math.max(1, Math.floor(quantity))),
          selectedColor,
          selectedSize,
        },
      ]
    })
  }

  function removeFromCart(id: number, color?: string, size?: string) {
    setCart((current) =>
      current.filter(
        (item) =>
          !(
            item.id === id &&
            item.selectedColor === color &&
            item.selectedSize === size
          )
      )
    )
  }

  function updateQuantity(
    id: number,
    quantity: number,
    color?: string,
    size?: string
  ) {
    if (quantity <= 0) {
      removeFromCart(id, color, size)
      return
    }

    setCart((current) =>
      current.map((item) =>
        item.id === id &&
        item.selectedColor === color &&
        item.selectedSize === size
          ? { ...item, quantity: Math.min(getCartItemStock(item), Math.floor(quantity)) }
          : item
      )
    )
  }

  function clearCart() {
    setCart([])
  }

  const cartHasStockIssue = cart.some((item) => getCartItemStock(item) < item.quantity)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
        refreshCartStock,
        cartHasStockIssue,
        stockChecking,
        stockError,
        cartCount,
        cartTotal,
        mounted,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used inside CartProvider")
  }

  return context
}
