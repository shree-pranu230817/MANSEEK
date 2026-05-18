import p1 from "@/assets/prod-1.jpg";
import p2 from "@/assets/prod-2.jpg";
import p3 from "@/assets/prod-3.jpg";
import p4 from "@/assets/prod-4.jpg";
import catTees from "@/assets/cat-tees.jpg";
import catHoodies from "@/assets/cat-hoodies.jpg";
import catPants from "@/assets/cat-pants.jpg";
import catAcc from "@/assets/cat-acc.jpg";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  oldPrice?: number;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  description: string;
  badge?: "NEW" | "SALE" | "SOLD OUT";
  rating: number;
  reviews: number;
  stock: number;
};

export const categories = [
  { slug: "tees", label: "Tees", image: catTees, count: 24 },
  { slug: "hoodies", label: "Hoodies", image: catHoodies, count: 18 },
  { slug: "pants", label: "Pants", image: catPants, count: 12 },
  { slug: "accessories", label: "Accessories", image: catAcc, count: 9 },
];

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const baseColors = [
  { name: "Black", hex: "#0a0a0a" },
  { name: "Bone", hex: "#f5f5f0" },
  { name: "Lime", hex: "#e8ff47" },
];

export const products: Product[] = [
  {
    id: "p1",
    slug: "void-oversized-tee",
    name: "Void Oversized Tee",
    category: "tees",
    categoryLabel: "Tees",
    price: 1499,
    oldPrice: 1999,
    images: [p1, p2],
    sizes,
    colors: baseColors,
    description:
      "Heavyweight 280 GSM cotton. Boxy drop-shoulder fit. Pre-washed for zero shrinkage. Built for the street, made to last.",
    badge: "SALE",
    rating: 4.8,
    reviews: 142,
    stock: 24,
  },
  {
    id: "p2",
    slug: "ghost-hoodie-bone",
    name: "Ghost Hoodie — Bone",
    category: "hoodies",
    categoryLabel: "Hoodies",
    price: 2799,
    images: [p2, p1],
    sizes,
    colors: baseColors,
    description:
      "Brushed fleece interior. Oversized hood, kangaroo pocket, ribbed cuffs. The everyday flex.",
    badge: "NEW",
    rating: 4.9,
    reviews: 88,
    stock: 18,
  },
  {
    id: "p3",
    slug: "obsidian-cargo-pants",
    name: "Obsidian Cargo Pants",
    category: "pants",
    categoryLabel: "Pants",
    price: 2299,
    images: [p3, p1],
    sizes,
    colors: baseColors,
    description:
      "Tapered cargo cut. 6 utility pockets. Stretch-cotton twill. Move how you want.",
    rating: 4.7,
    reviews: 64,
    stock: 12,
  },
  {
    id: "p4",
    slug: "neon-flux-bomber",
    name: "Neon Flux Bomber",
    category: "hoodies",
    categoryLabel: "Outerwear",
    price: 4499,
    oldPrice: 5499,
    images: [p4, p3],
    sizes,
    colors: baseColors,
    description:
      "Matte nylon shell. Electric lime satin lining. Reverse it for impact. A statement piece.",
    badge: "NEW",
    rating: 5.0,
    reviews: 41,
    stock: 6,
  },
  {
    id: "p5",
    slug: "static-tee-bone",
    name: "Static Tee — Bone",
    category: "tees",
    categoryLabel: "Tees",
    price: 1299,
    images: [p2, p1],
    sizes,
    colors: baseColors,
    description: "Minimal logo hit. Tubular knit. Cleanest white-tee energy.",
    rating: 4.6,
    reviews: 210,
    stock: 32,
  },
  {
    id: "p6",
    slug: "concrete-hoodie-black",
    name: "Concrete Hoodie — Black",
    category: "hoodies",
    categoryLabel: "Hoodies",
    price: 2599,
    images: [p1, p2],
    sizes,
    colors: baseColors,
    description: "All-black everything. Heavyweight fleece. Cropped, boxy fit.",
    rating: 4.8,
    reviews: 96,
    stock: 0,
    badge: "SOLD OUT",
  },
  {
    id: "p7",
    slug: "raid-utility-pants",
    name: "Raid Utility Pants",
    category: "pants",
    categoryLabel: "Pants",
    price: 2499,
    images: [p3, p4],
    sizes,
    colors: baseColors,
    description: "Wide-leg techwear silhouette. Reinforced knees. Tonal stitching.",
    rating: 4.7,
    reviews: 38,
    stock: 14,
  },
  {
    id: "p8",
    slug: "circuit-cap-lime",
    name: "Circuit Cap — Lime",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 899,
    images: [p4, p3],
    sizes: ["OS"],
    colors: baseColors,
    description: "6-panel cap. Embroidered crest. One size, all attitude.",
    rating: 4.9,
    reviews: 57,
    stock: 22,
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProducts(filters?: {
  category?: string;
  size?: string;
  sort?: string;
}) {
  let list = [...products];
  if (filters?.category) list = list.filter((p) => p.category === filters.category);
  if (filters?.size) list = list.filter((p) => p.sizes.includes(filters.size!));
  if (filters?.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (filters?.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  return list;
}
