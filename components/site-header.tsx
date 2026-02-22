"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToEstimador = () => {
    const el = document.getElementById("estimador");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "bg-card/80 backdrop-blur-xl shadow-sm border-border"
          : "bg-card border-border/50"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Logo */}
        <a
          href="#"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
            <ShieldCheck className="size-[18px]" strokeWidth={2.2} />
            <div className="absolute -inset-0.5 rounded-xl bg-primary/20 blur-sm -z-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground leading-tight">
              PrimaUSA
            </span>
            <span className="text-[10px] font-medium text-muted-foreground leading-tight tracking-wide uppercase">
              Estimador
            </span>
          </div>
        </a>

        {/* CTA */}
        <Button
          size="sm"
          className="gap-1.5 shadow-md shadow-primary/20"
          onClick={scrollToEstimador}
        >
          Comenzar
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </header>
  );
}
