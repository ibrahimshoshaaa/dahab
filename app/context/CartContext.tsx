"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Product } from "../data/products"

export type CartItem = Product & {
  quantity: number
  selectedColor?: string
  selectedSize?: string
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
  cartCount: number
  cartTotal: number
  mounted: boolean
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Restoring persisted cart on mount (client-only, can't be read during SSR).
    const saved = localStorage.getItem("dahab-cart")

    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(JSON.parse(saved))
      } catch {
        localStorage.removeItem("dahab-cart")
      }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    localStorage.setItem("dahab-cart", JSON.stringify(cart))
  }, [cart])

  function addToCart(
    product: Product,
    quantity = 1,
    selectedColor?: string,
    selectedSize?: string
  ) {
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
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }

      return [
        ...current,
        {
          ...product,
          quantity,
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
          ? { ...item, quantity }
          : item
      )
    )
  }

  function clearCart() {
    setCart([])
  }

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
