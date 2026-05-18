import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-off-black border-t border-dark-gray mt-32">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <p className="font-display text-3xl tracking-[0.2em] text-white">MANSEEK</p>
          <p className="mt-4 text-sm text-light-gray max-w-xs">
            Street luxury, built for the bold. Drops every Friday.
          </p>
          <div className="mt-6 flex gap-3">
            {[Instagram, Twitter, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-10 w-10 place-items-center rounded-full bg-charcoal text-white hover:bg-lime hover:text-black transition"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {[
          {
            title: "Shop",
            links: [
              { to: "/shop", label: "All" },
              { to: "/shop?category=tees", label: "Tees" },
              { to: "/shop?category=hoodies", label: "Hoodies" },
              { to: "/custom", label: "Custom" },
            ],
          },
          {
            title: "Help",
            links: [
              { to: "/track-order", label: "Track Order" },
              { to: "#", label: "Size Guide" },
              { to: "#", label: "Returns" },
              { to: "#", label: "Contact" },
            ],
          },
          {
            title: "Brand",
            links: [
              { to: "#", label: "About" },
              { to: "#", label: "Sustainability" },
              { to: "/admin/login", label: "Admin" },
              { to: "#", label: "Press" },
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <p className="font-display tracking-widest text-sm text-lime mb-4">
              {col.title}
            </p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to as string}
                    className="text-sm text-light-gray hover:text-white transition"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-dark-gray py-6 text-center text-xs text-mid-gray">
        © {new Date().getFullYear()} ManSeek. Wear Your Story.
      </div>
    </footer>
  );
}
