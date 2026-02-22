import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UserRound,
  HeartPulse,
  Baby,
  Cigarette,
  MapPin,
  Scale,
} from "lucide-react";

const factors = [
  {
    icon: UserRound,
    label: "Edad",
    desc: "Tu edad actual (18 - 64). Una mayor edad generalmente incrementa las primas.",
  },
  {
    icon: HeartPulse,
    label: "Sexo",
    desc: "El sexo biologico puede influir en los precios segun datos actuariales.",
  },
  {
    icon: Scale,
    label: "IMC",
    desc: "Indice de Masa Corporal calculado a partir de altura y peso, o ingresado directamente.",
  },
  {
    icon: Baby,
    label: "Hijos",
    desc: "Numero de dependientes cubiertos bajo tu plan (0 - 5).",
  },
  {
    icon: Cigarette,
    label: "Fumador",
    desc: "Fumar afecta significativamente los costos del seguro y el riesgo de salud.",
  },
  {
    icon: MapPin,
    label: "Region",
    desc: "Tu region de EE.UU. (NE, NO, SE, SO) impacta los factores de precio locales.",
  },
];

export default function InfoPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{"Como Funciona"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Este estimador utiliza factores comunes de salud y datos demograficos
          para proyectar tu prima de seguro anual potencial. Completa el
          formulario para recibir una estimacion.
        </p>
        <div className="flex flex-col gap-3">
          {factors.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
