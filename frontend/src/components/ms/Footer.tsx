import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";

const SOCIALS = [
  {
    Icon: Instagram,
    href: "https://www.instagram.com/manseek_dtf?igsh=eGxrcjNzaGl2Y2pt",
    label: "Instagram",
  },
  {
    Icon: Youtube,
    href: "https://youtube.com/@manseek1?si=fJfZGv-yVNhorQWR",
    label: "YouTube",
  },
  {
    Icon: Facebook,
    href: "https://www.facebook.com/share/1JqCgDbvLB/",
    label: "Facebook",
  },
];

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
            {SOCIALS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`ManSeek on ${label}`}
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
              { to: "mailto:manseek2025@gmail.com", label: "manseek2025@gmail.com" },
              { to: "https://wa.me/918088711996", label: "WhatsApp Support" },
              { to: "mailto:manseek2025@gmail.com", label: "Customer Support" },
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
