import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/ms/ProductCard";
import { MSButton } from "@/components/ms/Button";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  category: z.string().optional().catch(undefined),
  size: z.string().optional().catch(undefined),
  color: z.string().optional().catch(undefined),
  sort: z.enum(["newest", "price-asc", "price-desc", "popular"]).optional().catch("newest"),
});

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const q = new URLSearchParams();
    if (deps.category) q.append("category", deps.category);
    if (deps.size) q.append("size", deps.size);
    if (deps.color) q.append("color", deps.color);
    if (deps.sort) q.append("sort", deps.sort);
    
    const [catRes, prodRes, allProdRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/categories`),
      fetch(`${import.meta.env.VITE_API_URL}/products?${q.toString()}`),
      fetch(`${import.meta.env.VITE_API_URL}/products?limit=100`)
    ]);
    const categories = catRes.ok ? await catRes.json() : [];
    const prodData = prodRes.ok ? await prodRes.json() : { products: [] };
    const allProdData = allProdRes.ok ? await allProdRes.json() : { products: [] };

    // Extract dynamic unique colors and sizes from the entire catalog
    const colorMap = new Map();
    allProdData.products.forEach((p: any) => {
      if (Array.isArray(p.colors)) {
        p.colors.forEach((c: any) => {
          if (c.hex && c.name) {
            colorMap.set(c.hex.toLowerCase(), c.name);
          }
        });
      }
    });
    const availableColors = Array.from(colorMap.entries()).map(([hex, name]) => ({ hex, name }));

    const sizeSet = new Set<string>();
    allProdData.products.forEach((p: any) => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach((s: string) => sizeSet.add(s));
      }
    });
    // Custom sort for sizes: standard tops, numeric waist sizes, and custom
    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "ONESIZE"];
    const availableSizes = Array.from(sizeSet).sort((a, b) => {
      const idxA = sizeOrder.indexOf(a);
      const idxB = sizeOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const mappedProducts = prodData.products.map((p: any) => ({
      ...p,
      price: p.sale_price || p.base_price,
      oldPrice: p.sale_price ? p.base_price : null,
    }));
    return { categories, products: mappedProducts, availableColors, availableSizes };
  },
  head: () => ({
    meta: [
      { title: "Shop All — ManSeek" },
      { name: "description", content: "Browse all ManSeek streetwear drops." },
    ],
  }),
  component: Shop,
});

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SORTS = [
  { v: "newest", l: "Newest" },
  { v: "price-asc", l: "Price ↑" },
  { v: "price-desc", l: "Price ↓" },
  { v: "popular", l: "Popular" },
] as const;

function Shop() {
  const { category, size, color, sort } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { categories, products, availableColors, availableSizes } = Route.useLoaderData();
  const [openSort, setOpenSort] = useState(false);
  const [openColorDropdown, setOpenColorDropdown] = useState(false);
  const [openMobileColorDropdown, setOpenMobileColorDropdown] = useState(false);

  // Normalize and deduplicate categories to prevent duplicate entries (e.g. Pants and pants)
  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: any[] = [];
    (categories || [])
      .filter((c: any) => c && c.is_visible !== false)
      .forEach((c: any) => {
        const slugNorm = (c.slug || "").toLowerCase().trim();
        const nameNorm = (c.name || "").toLowerCase().trim();
        if (slugNorm && !seen.has(slugNorm) && !seen.has(nameNorm)) {
          seen.add(slugNorm);
          seen.add(nameNorm);
          result.push({
            ...c,
            slug: slugNorm,
            name: c.name ? c.name.charAt(0).toUpperCase() + c.name.slice(1) : slugNorm,
          });
        }
      });
    return result;
  }, [categories]);

  const activeSortLabel = SORTS.find((s) => s.v === sort)?.l || "Newest";

  return (
    <div className="mx-auto max-w-[1400px] px-4 lg:px-8 pt-8 pb-12">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 pb-6 border-b border-dark-gray/30 gap-4">
        <div>
          <p className="font-accent italic text-lime">All drops</p>
          <h1 className="font-display text-5xl lg:text-7xl tracking-tight">SHOP</h1>
          <p className="mt-2 text-light-gray text-sm">
            {products.length} {products.length === 1 ? "item" : "items"}
            {category ? ` in ${uniqueCategories.find((c: any) => c.slug.toLowerCase() === category.toLowerCase())?.name || category}` : ""}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setOpenSort(!openSort)}
              className="h-10 px-4 bg-off-black border border-dark-gray hover:border-lime rounded-sm text-xs flex items-center gap-2 text-white transition-all font-display tracking-wider"
            >
              SORT: {activeSortLabel.toUpperCase()}
              <ChevronDown className={cn("h-4 w-4 text-light-gray transition-transform", openSort && "rotate-180")} />
            </button>

            {openSort && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setOpenSort(false)} />
                <div className="absolute right-0 mt-2 w-48 z-40 bg-off-black border border-dark-gray rounded-sm shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {SORTS.map((s) => (
                    <button
                      key={s.v}
                      onClick={() => {
                        navigate({
                          search: (p: Record<string, unknown>) => ({ ...p, sort: s.v }),
                        });
                        setOpenSort(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-[10px] font-display tracking-widest transition-all hover:bg-charcoal/50",
                        sort === s.v ? "text-lime bg-charcoal/30 font-bold" : "text-light-gray hover:text-white"
                      )}
                    >
                      {s.l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Category Filters (Directly visible without any button) */}
      <div className="lg:hidden mb-8 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="font-display tracking-widest text-xs text-lime uppercase">Category</p>
            {(category || size || color) && (
              <button
                onClick={() => navigate({ search: () => ({ sort: "newest" as const }) })}
                className="text-[11px] text-light-gray hover:text-white underline font-mono"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            <button
              onClick={() => navigate({ search: (p: Record<string, unknown>) => ({ ...p, category: undefined }) })}
              className={cn(
                "shrink-0 h-9 px-4 rounded-sm text-xs font-display tracking-wider border transition-all flex items-center justify-center",
                !category
                  ? "bg-lime text-black border-lime font-bold"
                  : "bg-off-black border-dark-gray text-light-gray hover:text-white hover:border-light-gray"
              )}
            >
              ALL
            </button>
            {uniqueCategories.map((c: any) => {
              const isSelected = category?.toLowerCase() === c.slug.toLowerCase();
              return (
                <button
                  key={c.slug}
                  onClick={() =>
                    navigate({
                      search: (p: Record<string, unknown>) => ({
                        ...p,
                        category: isSelected ? undefined : c.slug,
                      }),
                    })
                  }
                  className={cn(
                    "shrink-0 h-9 px-4 rounded-sm text-xs font-display tracking-wider border transition-all flex items-center justify-center",
                    isSelected
                      ? "bg-lime text-black border-lime font-bold"
                      : "bg-off-black border-dark-gray text-light-gray hover:text-white hover:border-light-gray"
                  )}
                >
                  {c.name.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Size & Color Filters (Directly visible and interactive on mobile) */}
        {(availableSizes.length > 0 || availableColors.length > 0) && (
          <div className="space-y-3 pt-3 border-t border-dark-gray/30">
            {availableSizes.length > 0 && (
              <div>
                <p className="font-display tracking-widest text-[11px] text-light-gray mb-1.5 uppercase">Size</p>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                  {availableSizes.map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        navigate({
                          search: (p: Record<string, unknown>) => ({
                            ...p,
                            size: size === s ? undefined : s,
                          }),
                        })
                      }
                      className={cn(
                        "shrink-0 h-8 min-w-8 px-2 text-xs rounded-sm border transition font-mono flex items-center justify-center",
                        size === s
                          ? "bg-lime text-black border-lime font-bold"
                          : "border-dark-gray text-light-gray hover:border-white hover:text-white bg-off-black"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableColors.length > 0 && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="relative flex-1 max-w-[220px]">
                  <button
                    onClick={() => setOpenMobileColorDropdown(!openMobileColorDropdown)}
                    className="w-full h-8 px-3 bg-off-black border border-dark-gray hover:border-lime rounded-sm text-[11px] flex items-center justify-between text-white transition-all font-display tracking-widest text-left"
                  >
                    <span className="truncate">
                      {color
                        ? (availableColors.find((c) => c.hex.toLowerCase() === color.toLowerCase())?.name || "COLOR").toUpperCase()
                        : "COLOR: ALL"}
                    </span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-light-gray transition-transform shrink-0 ml-1", openMobileColorDropdown && "rotate-180")} />
                  </button>
                  {openMobileColorDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setOpenMobileColorDropdown(false)} />
                      <div className="absolute left-0 mt-1 w-48 z-40 bg-off-black border border-dark-gray rounded-sm shadow-2xl backdrop-blur-md overflow-hidden max-h-48 overflow-y-auto animate-in fade-in duration-150">
                        <button
                          onClick={() => {
                            navigate({ search: (p: Record<string, unknown>) => ({ ...p, color: undefined }) });
                            setOpenMobileColorDropdown(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-[10px] font-display tracking-widest transition-all hover:bg-charcoal/50",
                            !color ? "text-lime bg-charcoal/30 font-bold" : "text-light-gray hover:text-white"
                          )}
                        >
                          ALL COLORS
                        </button>
                        {availableColors.map((c) => {
                          const isSelected = color?.toLowerCase() === c.hex.toLowerCase();
                          return (
                            <button
                              key={c.hex}
                              onClick={() => {
                                navigate({
                                  search: (p: Record<string, unknown>) => ({ ...p, color: c.hex }),
                                });
                                setOpenMobileColorDropdown(false);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 text-[10px] font-display tracking-widest transition-all hover:bg-charcoal/50 flex items-center gap-2",
                                isSelected ? "text-lime bg-charcoal/30 font-bold" : "text-light-gray hover:text-white"
                              )}
                            >
                              <span className="h-2.5 w-2.5 rounded-full border border-dark-gray shrink-0" style={{ background: c.hex }} />
                              <span className="truncate">{c.name.toUpperCase()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {(size || color) && (
                  <button
                    onClick={() =>
                      navigate({
                        search: (p: Record<string, unknown>) => ({
                          ...p,
                          size: undefined,
                          color: undefined,
                        }),
                      })
                    }
                    className="text-[11px] text-light-gray hover:text-white underline font-mono"
                  >
                    Reset Size/Color
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-[240px_1fr] gap-10 items-start">
        {/* Desktop Sidebar Filters (Unchanged for desktop) */}
        <aside className="hidden lg:block">
          <FilterGroup title="Category">
            <button
              onClick={() => navigate({ search: (p: Record<string, unknown>) => ({ ...p, category: undefined }) })}
              className={cn(
                "block w-full text-left text-sm py-1.5",
                !category ? "text-lime font-bold" : "text-light-gray hover:text-white",
              )}
            >
              All
            </button>
            {uniqueCategories.map((c: any) => (
              <button
                key={c.slug}
                onClick={() =>
                  navigate({ search: (p: Record<string, unknown>) => ({ ...p, category: c.slug }) })
                }
                className={cn(
                  "block w-full text-left text-sm py-1.5",
                  category?.toLowerCase() === c.slug.toLowerCase()
                    ? "text-lime font-bold"
                    : "text-light-gray hover:text-white",
                )}
              >
                {c.name}
              </button>
            ))}
          </FilterGroup>

          {availableSizes.length > 0 && (
            <FilterGroup title="Size">
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      navigate({
                        search: (p: Record<string, unknown>) => ({ ...p, size: size === s ? undefined : s }),
                      })
                    }
                    className={cn(
                      "h-9 min-w-9 px-2 text-xs rounded-sm border transition font-mono",
                      size === s
                        ? "bg-lime text-black border-lime font-bold"
                        : "border-dark-gray text-light-gray hover:border-white hover:text-white",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FilterGroup>
          )}

          {availableColors.length > 0 && (
            <FilterGroup title="Color">
              <div className="relative">
                <button
                  onClick={() => setOpenColorDropdown(!openColorDropdown)}
                  className="w-full h-10 px-3 bg-off-black border border-dark-gray hover:border-lime rounded-sm text-xs flex items-center justify-between text-white transition-all font-display tracking-widest text-left"
                >
                  {color ? (availableColors.find(c => c.hex.toLowerCase() === color.toLowerCase())?.name || "SELECTED COLOR").toUpperCase() : "ALL COLORS"}
                  <ChevronDown className={cn("h-4 w-4 text-light-gray transition-transform", openColorDropdown && "rotate-180")} />
                </button>

                {openColorDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpenColorDropdown(false)} />
                    <div className="absolute left-0 right-0 mt-2 w-full z-40 bg-off-black border border-dark-gray rounded-sm shadow-2xl backdrop-blur-md overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={() => {
                          navigate({ search: (p: Record<string, unknown>) => ({ ...p, color: undefined }) });
                          setOpenColorDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-[10px] font-display tracking-widest transition-all hover:bg-charcoal/50",
                          !color ? "text-lime bg-charcoal/30 font-bold" : "text-light-gray hover:text-white"
                        )}
                      >
                        ALL COLORS
                      </button>
                      {availableColors.map((c) => {
                        const isSelected = color?.toLowerCase() === c.hex.toLowerCase();
                        return (
                          <button
                            key={c.hex}
                            onClick={() => {
                              navigate({
                                search: (p: Record<string, unknown>) => ({ ...p, color: c.hex }),
                              });
                              setOpenColorDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-[10px] font-display tracking-widest transition-all hover:bg-charcoal/50 flex items-center gap-2",
                              isSelected ? "text-lime bg-charcoal/30 font-bold" : "text-light-gray hover:text-white"
                            )}
                          >
                            <span className="h-2.5 w-2.5 rounded-full border border-dark-gray" style={{ background: c.hex }} />
                            {c.name.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </FilterGroup>
          )}

          {(category || size || color) && (
            <MSButton
              variant="ghost"
              className="mt-4 w-full"
              size="sm"
              onClick={() =>
                navigate({
                  search: () => ({ sort: "newest" as const }),
                })
              }
            >
              Clear all
            </MSButton>
          )}
        </aside>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="py-32 text-center w-full">
            <p className="font-display text-3xl">NO MATCHES</p>
            <p className="text-light-gray mt-2 text-sm">Try clearing your filters.</p>
            <Link to="/shop">
              <MSButton className="mt-6" variant="outline">
                Clear filters
              </MSButton>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 w-full">
            {products.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 pb-6 border-b border-dark-gray last:border-none">
      <p className="font-display tracking-widest text-sm text-lime mb-3">{title}</p>
      {children}
    </div>
  );
}
