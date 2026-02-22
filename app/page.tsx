import InsuranceForm from "@/components/insurance-form";
import InfoPanel from "@/components/info-panel";
import SiteHeader from "@/components/site-header";
import { ShieldCheck, TrendingDown, Users } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-card">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute -bottom-32 -left-32 size-[28rem] rounded-full bg-accent/[0.04] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="flex flex-col items-center text-center gap-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
              Estima el costo de tu{" "}
              <span className="text-primary">seguro de salud</span>
            </h1>

            <p className="max-w-2xl text-base text-muted-foreground leading-relaxed text-balance sm:text-lg">
              Ingresa tus datos personales y factores de salud para obtener una
              proyeccion rapida de tu prima anual de seguro medico en Estados
              Unidos.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 sm:gap-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="size-4 text-primary" />
                </div>
                <span>
                  <strong className="text-foreground">6</strong> factores clave
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
                  <TrendingDown className="size-4 text-accent" />
                </div>
                <span>
                  Resultado <strong className="text-foreground">al instante</strong>
                </span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <main
        id="estimador"
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <InsuranceForm />
          <aside id="factores">
            <InfoPanel />
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer id="metodologia" className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-3.5" strokeWidth={2.2} />
              </div>
              <span className="text-sm font-semibold text-foreground">
                SeguroCost
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-right max-w-md">
              Este estimador es una herramienta educativa. Las proyecciones no
              constituyen una cotizacion oficial ni una oferta de seguro.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
