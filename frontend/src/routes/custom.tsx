import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import custom from "@/assets/custom-cta.jpg";
import { MSButton } from "@/components/ms/Button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/custom")({
  head: () => ({ meta: [{ title: "Design Your Own — ManSeek" }] }),
  component: Custom,
});

const bases = ["Tee", "Hoodie", "Bomber"] as const;
const colors = [
  { name: "Black", hex: "#0a0a0a" },
  { name: "Bone", hex: "#f5f5f0" },
  { name: "Lime", hex: "#e8ff47" },
];

function Custom() {
  const [base, setBase] = useState<(typeof bases)[number]>("Tee");
  const [color, setColor] = useState(colors[0].hex);
  const [text, setText] = useState("YOUR STORY");

  return (
    <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-12">
      <div className="mb-10">
        <p className="font-accent italic text-lime">Made for you only</p>
        <h1 className="font-display text-5xl lg:text-7xl tracking-tight">DESIGN YOUR OWN</h1>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
        <div className="relative aspect-[4/5] bg-charcoal rounded-md overflow-hidden" style={{ background: color }}>
          <img src={custom} alt="" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-70" />
          <div className="absolute inset-0 grid place-items-center">
            <p className="font-display text-4xl lg:text-7xl tracking-widest" style={{ color: color === "#f5f5f0" || color === "#e8ff47" ? "#0a0a0a" : "#f5f5f0" }}>
              {text || "YOUR STORY"}
            </p>
          </div>
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 backdrop-blur rounded-sm text-xs font-display tracking-widest">{base.toUpperCase()}</div>
        </div>

        <div className="space-y-8">
          <Group title="Base">
            <div className="flex gap-2">
              {bases.map((b) => (
                <button key={b} onClick={() => setBase(b)} className={cn("h-11 px-5 rounded-pill border text-sm font-display tracking-widest", base === b ? "bg-lime text-black border-lime" : "border-dark-gray text-light-gray hover:text-white")}>
                  {b}
                </button>
              ))}
            </div>
          </Group>
          <Group title="Color">
            <div className="flex gap-3">
              {colors.map((c) => (
                <button key={c.hex} onClick={() => setColor(c.hex)} className={cn("h-12 w-12 rounded-full border-2", color === c.hex ? "border-lime" : "border-dark-gray")} style={{ background: c.hex }} />
              ))}
            </div>
          </Group>
          <Group title="Print Text">
            <input value={text} onChange={(e) => setText(e.target.value.toUpperCase().slice(0, 24))} maxLength={24} className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm font-display tracking-widest focus:border-lime focus:outline-none" />
            <p className="text-xs text-mid-gray mt-2">Max 24 characters. Letters only.</p>
          </Group>
          <div className="pt-4 border-t border-dark-gray">
            <p className="font-display text-3xl text-lime">₹1,999</p>
            <p className="text-xs text-mid-gray mt-1">Made to order · 7–10 day production</p>
            <MSButton size="lg" className="w-full mt-4" onClick={() => {
              const msg = encodeURIComponent(`Hi, I'd like to order a Custom ${base} in color ${color} with text: "${text}"`);
              window.open(`https://wa.me/918088711996?text=${msg}`, '_blank');
            }}>
              Order via WhatsApp
            </MSButton>
          </div>
        </div>
      </div>
    </div>
  );
}

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="font-display tracking-widest text-sm text-lime mb-3">{title}</p>
    {children}
  </div>
);
