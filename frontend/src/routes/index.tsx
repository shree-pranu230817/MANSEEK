import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import customCta from "@/assets/custom-cta.jpg";
import { MSButton } from "@/components/ms/Button";
import { ProductCard } from "@/components/ms/ProductCard";
import { Marquee } from "@/components/ms/Marquee";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [catRes, prodRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/categories`),
      fetch(`${import.meta.env.VITE_API_URL}/products?limit=4`)
    ]);
    const categories = catRes.ok ? await catRes.json() : [];
    const prodData = prodRes.ok ? await prodRes.json() : { products: [] };
    const mappedProducts = prodData.products.map((p: any) => ({
      ...p,
      price: p.sale_price || p.base_price,
      oldPrice: p.sale_price ? p.base_price : null,
    }));
    return { categories, products: mappedProducts };
  },
  head: () => ({
    meta: [
      { title: "ManSeek — Wear Your Story | Premium Streetwear" },
      {
        name: "description",
        content:
          "Bold drops every Friday. Premium men's streetwear from India. Free shipping above ₹999.",
      },
    ],
  }),
  component: Home,
});

const heroLines = ["WEAR", "YOUR", "STORY."];

function Home() {
  const { categories, products: featured } = Route.useLoaderData();

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-dvh -mt-16 pt-16 bg-gradient-hero overflow-hidden noise">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-dvh py-20">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-accent italic text-lime text-lg"
            >
              Drop 014 — Concrete Dreams
            </motion.p>
            <h1 className="mt-4 font-display text-[18vw] sm:text-[14vw] lg:text-[9vw] leading-[0.85] tracking-tight">
              {heroLines.map((line, i) => (
                <motion.span
                  key={line}
                  initial={{ y: 120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.9,
                    delay: i * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="block"
                >
                  {line === "STORY." ? (
                    <>
                      <span className="text-lime">STO</span>RY<span className="text-lime">.</span>
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 max-w-md text-light-gray leading-relaxed font-display tracking-widest text-lg text-lime"
            >
              Print your Street Wear Spirit With ManSeek
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link to="/shop">
                <MSButton size="lg">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </MSButton>
              </Link>
              <MSButton variant="outline" size="lg">
                Our Story
              </MSButton>
            </motion.div>
          </div>

          {/* asymmetric collage */}
          <div className="relative h-[60vh] lg:h-[80vh] hidden lg:block">
            <motion.img
              src={hero1}
              alt=""
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="absolute top-0 right-0 w-[58%] h-[70%] object-cover rounded-md shadow-hover"
            />
            <motion.img
              src={hero3}
              alt=""
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute bottom-0 left-0 w-[48%] h-[55%] object-cover rounded-md shadow-hover border border-dark-gray"
            />
            <motion.img
              src={hero2}
              alt=""
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="absolute bottom-[10%] right-[5%] w-[34%] h-[34%] object-cover rounded-md shadow-lime border-2 border-lime"
            />
          </div>
        </div>
      </section>

      <Marquee
        items={[
          "NEW ARRIVALS",
          "FREE SHIPPING ABOVE ₹999",
          "EXCLUSIVE DROPS",
          "BUILT IN INDIA",
          "DROP 014 LIVE",
        ]}
      />

      {/* CATEGORIES */}
      <section className="py-24 mx-auto max-w-[1400px] px-4 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="font-accent italic text-lime">Curated by mood</p>
            <h2 className="font-display text-5xl lg:text-7xl tracking-tight">
              SHOP BY VIBE
            </h2>
          </div>
          <Link
            to="/shop"
            className="hidden md:inline-flex items-center gap-2 font-display tracking-widest text-sm text-light-gray hover:text-lime"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c: any, i: number) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to="/shop"
                search={{ category: c.slug }}
                className="group relative block aspect-[3/4] overflow-hidden rounded-md bg-charcoal"
              >
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-card" />
                <div className="absolute inset-x-0 bottom-0 p-5 transition-all duration-300 group-hover:pb-7">
                  <p className="font-display text-3xl text-white">{c.name}</p>
                </div>
                <div className="absolute inset-0 ring-0 group-hover:ring-2 ring-lime rounded-md transition-all group-hover:shadow-lime" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-24 mx-auto max-w-[1400px] px-4 lg:px-8">
        <div className="mb-12">
          <p className="font-accent italic text-lime">Just dropped</p>
          <h2 className="font-display text-5xl lg:text-7xl tracking-tight relative inline-block">
            FRESH DROPS
            <span className="absolute -bottom-2 left-0 right-0 h-1 bg-lime" />
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {featured.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link to="/shop">
            <MSButton variant="outline" size="lg">
              View All Drops
            </MSButton>
          </Link>
        </div>
      </section>

      {/* CUSTOM CTA */}
      <section className="relative py-24 mx-auto max-w-[1400px] px-4 lg:px-8">
        <div className="relative grid lg:grid-cols-2 rounded-lg overflow-hidden bg-off-black border border-dark-gray">
          <div className="p-10 lg:p-16 flex flex-col justify-center">
            <p className="font-accent italic text-lime">Made just for you</p>
            <h2 className="mt-2 font-display text-5xl lg:text-7xl tracking-tight leading-[0.9]">
              DESIGN YOUR <span className="text-lime">OWN</span>
            </h2>
            <p className="mt-6 text-light-gray max-w-md">
              Custom prints, custom fits, custom story. Start with a blank canvas, end
              with something nobody else owns.
            </p>
            <div className="mt-8">
              <Link to="/custom">
                <MSButton size="lg">Start Designing</MSButton>
              </Link>
            </div>
          </div>
          <div
            className="relative min-h-[400px] lg:min-h-0"
            style={{ clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%)" }}
          >
            <img
              src={customCta}
              alt="Custom streetwear"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 mx-auto max-w-[1400px] px-4 lg:px-8">
        <div className="mb-12 text-center">
          <p className="font-accent italic text-lime">Real voices</p>
          <h2 className="font-display text-5xl lg:text-6xl tracking-tight">
            WHAT THEY SAY
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              q: "Fit cuts different. Heavier than anything Indian I've owned. Worth every rupee.",
              n: "ARJUN K.",
              c: "Mumbai",
            },
            {
              q: "The bomber is unreal. Lime lining flips heads. People literally stop me.",
              n: "RAVI S.",
              c: "Bengaluru",
            },
            {
              q: "Finally a streetwear brand that gets it. No filler, just hits.",
              n: "AKASH P.",
              c: "Delhi",
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-off-black border border-dark-gray rounded-lg p-8"
            >
              <div className="flex gap-1 text-lime">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-6 font-accent italic text-2xl leading-snug">"{t.q}"</p>
              <p className="mt-6 font-display tracking-widest text-sm">{t.n}</p>
              <p className="text-xs text-mid-gray">{t.c}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-off-black border-y border-dark-gray">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="font-accent italic text-lime">Insider access</p>
            <h2 className="mt-2 font-display text-4xl lg:text-5xl tracking-tight">
              FIRST DIBS ON <span className="text-lime">EVERY DROP</span>
            </h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="flex gap-2"
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 h-14 px-5 bg-black border border-dark-gray rounded-pill text-base focus:border-lime focus:outline-none"
            />
            <MSButton type="submit" size="lg">
              Subscribe
            </MSButton>
          </form>
        </div>
      </section>
    </>
  );
}
