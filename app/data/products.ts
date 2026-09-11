export type SizeChart = {
  columns: string[]
  rows: string[][]
}

export type Product = {
  id: number
  slug: string
  name: string
  category: "عبايات" | "إكسسوارات"
  price: number
  oldPrice?: number
  image: string
  images?: string[]
  badge?: string
  colors: string[]
  sizes: string[]
  description: string
  featured?: boolean
  bestSeller?: boolean
  sizeChart?: SizeChart
  materialDetails?: string
  careInstructions?: string
}

export const products: Product[] = [
  {
    id: 1,
    slug: "abaya-lulu",
    name: "عباية لؤلؤة",
    category: "عبايات",
    price: 1499,
    oldPrice: 1799,
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900",
    badge: "الأكثر مبيعًا",
    colors: ["أسود", "بيج"],
    sizes: ["S", "M", "L", "XL"],
    description: "عباية أنيقة بتصميم راقٍ وخامة مريحة تناسب إطلالتك اليومية والمناسبات.",
    featured: true,
    bestSeller: true,
  },
  {
    id: 2,
    slug: "abaya-dahab",
    name: "عباية دهب",
    category: "عبايات",
    price: 1699,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900",
    badge: "جديد",
    colors: ["أسود", "بني"],
    sizes: ["M", "L", "XL", "XXL"],
    description: "تصميم عصري بلمسة فاخرة من دهب.",
    featured: true,
  },
  {
    id: 3,
    slug: "abaya-nokhba",
    name: "عباية نخبة",
    category: "عبايات",
    price: 1299,
    oldPrice: 1499,
    image: "https://images.unsplash.com/photo-1585488439659-9d8c3b4f6e8b?w=900",
    badge: "خصم",
    colors: ["أسود"],
    sizes: ["S", "M", "L", "XL"],
    description: "عباية عملية وأنيقة بتفاصيل بسيطة وفخمة.",
    bestSeller: true,
  },
  {
    id: 4,
    slug: "dahab-bag",
    name: "شنطة دهب",
    category: "إكسسوارات",
    price: 799,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900",
    badge: "جديد",
    colors: ["أسود", "بيج"],
    sizes: [],
    description: "شنطة أنيقة تكمل إطلالتك من دهب.",
    featured: true,
  },
  {
    id: 5,
    slug: "dahab-scarf",
    name: "طرحة دهب",
    category: "إكسسوارات",
    price: 299,
    image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=900",
    colors: ["بيج", "أسود", "أوف وايت"],
    sizes: [],
    description: "طرحة ناعمة وأنيقة بألوان تناسب مختلف الإطلالات.",
  },
  {
    id: 6,
    slug: "classic-abaya",
    name: "عباية كلاسيك",
    category: "عبايات",
    price: 1399,
    image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=900",
    colors: ["أسود", "رمادي"],
    sizes: ["M", "L", "XL", "XXL"],
    description: "ستايل كلاسيكي مناسب لكل يوم.",
    bestSeller: true,
  },
  {
    id: 7,
    slug: "gold-accessory",
    name: "إكسسوار دهب",
    category: "إكسسوارات",
    price: 399,
    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900",
    badge: "جديد",
    colors: ["ذهبي", "فضي"],
    sizes: [],
    description: "لمسة بسيطة تضيف أناقة مميزة لإطلالتك.",
  },
  {
    id: 8,
    slug: "abaya-elite",
    name: "عباية إيليت",
    category: "عبايات",
    price: 1899,
    image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=900",
    badge: "حصري",
    colors: ["أسود"],
    sizes: ["S", "M", "L", "XL"],
    description: "تصميم فاخر لمحبي الإطلالات الراقية.",
    featured: true,
  },
]

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug)
}
