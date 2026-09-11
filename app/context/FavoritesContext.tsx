"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Product } from "../data/products"

type FavoritesContextType = {
  favorites: Product[]
  toggleFavorite: (product: Product) => void
  isFavorite: (id: number) => boolean
  removeFavorite: (id: number) => void
  favoritesCount: number
  mounted: boolean
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Restoring persisted favorites on mount (client-only, can't be read during SSR).
    const saved = localStorage.getItem("dahab-favorites")

    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavorites(JSON.parse(saved))
      } catch {
        localStorage.removeItem("dahab-favorites")
      }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    localStorage.setItem("dahab-favorites", JSON.stringify(favorites))
  }, [favorites])

  function toggleFavorite(product: Product) {
    setFavorites((current) => {
      const exists = current.some((item) => item.id === product.id)

      if (exists) {
        return current.filter((item) => item.id !== product.id)
      }

      return [...current, product]
    })
  }

  function removeFavorite(id: number) {
    setFavorites((current) => current.filter((item) => item.id !== id))
  }

  function isFavorite(id: number) {
    return favorites.some((item) => item.id === id)
  }

  const favoritesCount = favorites.length

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        removeFavorite,
        favoritesCount,
        mounted,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)

  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider")
  }

  return context
}
