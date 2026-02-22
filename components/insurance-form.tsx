"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Minus,
  Plus,
  RotateCcw,
  Calculator,
  ShieldCheck,
  Info,
  AlertCircle,
} from "lucide-react";
import USRegionMap from "@/components/us-region-map";

interface FormState {
  age: number;
  sex: "male" | "female";
  bmiMode: "direct" | "calculate";
  bmi: string;
  heightCm: string;
  weightKg: string;
  children: number;
  smoker: boolean;
  region: string;
}

interface ValidationErrors {
  age?: string;
  bmi?: string;
  heightCm?: string;
  weightKg?: string;
  region?: string;
}

const DEFAULTS: FormState = {
  age: 30,
  sex: "male",
  bmiMode: "direct",
  bmi: "27.5",
  heightCm: "170",
  weightKg: "70",
  children: 0,
  smoker: false,
  region: "",
};

/** Sanitize a numeric string: no leading zeros, max 1 decimal digit */
function sanitizeNumericInput(raw: string, allowDecimal: boolean): string {
  // Remove non-numeric except dot
  let val = raw.replace(/[^0-9.]/g, "");

  if (!allowDecimal) {
    val = val.replace(/\./g, "");
  } else {
    // Keep only the first dot
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
    // Limit to 1 decimal place
    if (parts.length === 2 && parts[1].length > 1) {
      val = parts[0] + "." + parts[1].slice(0, 1);
    }
  }

  // Remove leading zeros (but keep "0" and "0.x")
  if (val.length > 1 && val[0] === "0" && val[1] !== ".") {
    val = val.replace(/^0+/, "") || "0";
  }

  return val;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="flex items-center gap-1 text-sm text-destructive mt-1"
      role="alert"
    >
      <AlertCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}

export default function InsuranceForm() {
  const [form, setForm] = useState<FormState>({ ...DEFAULTS });
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setTouched((prev) => ({ ...prev, [key]: true }));
      setSubmitted(false);
    },
    []
  );

  const bmiNum = parseFloat(form.bmi) || 0;
  const heightNum = parseFloat(form.heightCm) || 0;
  const weightNum = parseFloat(form.weightKg) || 0;

  const computedBmi = useMemo(() => {
    if (form.bmiMode === "calculate" && heightNum > 0) {
      const m = heightNum / 100;
      return Math.round((weightNum / (m * m)) * 10) / 10;
    }
    return bmiNum;
  }, [form.bmiMode, bmiNum, heightNum, weightNum]);

  const errors = useMemo<ValidationErrors>(() => {
    const e: ValidationErrors = {};
    if (form.age < 18 || form.age > 64)
      e.age = "La edad debe estar entre 18 y 64.";
    if (form.bmiMode === "direct" && (bmiNum < 10 || bmiNum > 60))
      e.bmi = "El IMC debe estar entre 10 y 60.";
    if (form.bmiMode === "calculate") {
      if (heightNum < 120 || heightNum > 220)
        e.heightCm = "La altura debe estar entre 120 y 220 cm.";
      if (weightNum < 30 || weightNum > 200)
        e.weightKg = "El peso debe estar entre 30 y 200 kg.";
    }
    if (!form.region) e.region = "Por favor selecciona una region.";
    return e;
  }, [form, bmiNum, heightNum, weightNum]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm({ ...DEFAULTS });
    setTouched({});
    setSubmitted(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="size-5 text-primary" />
              Tus Datos
            </CardTitle>
            <CardDescription>
              Completa tu informacion para obtener una estimacion del costo de tu
              seguro.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-8">
            {/* Edad */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="age" className="text-sm font-medium">
                  Edad
                </Label>
                <span className="text-sm font-semibold text-primary tabular-nums">
                  {form.age}
                </span>
              </div>
              <Slider
                id="age"
                min={18}
                max={64}
                step={1}
                value={[form.age]}
                onValueChange={([v]) => update("age", v)}
                aria-label="Edad"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>18</span>
                <span>64</span>
              </div>
              {touched.age && <FieldError message={errors.age} />}
            </div>

            {/* Sexo */}
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium">Sexo</Label>
              <RadioGroup
                value={form.sex}
                onValueChange={(v) => update("sex", v as "male" | "female")}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="male" id="sex-male" />
                  <Label
                    htmlFor="sex-male"
                    className="cursor-pointer font-normal"
                  >
                    Masculino
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="female" id="sex-female" />
                  <Label
                    htmlFor="sex-female"
                    className="cursor-pointer font-normal"
                  >
                    Femenino
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* IMC */}
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium">
                {"Indice de Masa Corporal (IMC)"}
              </Label>
              <Tabs
                value={form.bmiMode}
                onValueChange={(v) =>
                  update("bmiMode", v as "direct" | "calculate")
                }
              >
                <TabsList className="w-full">
                  <TabsTrigger value="direct" className="flex-1 text-xs sm:text-sm">
                    IMC directo
                  </TabsTrigger>
                  <TabsTrigger value="calculate" className="flex-1 text-xs sm:text-sm">
                    Calcular
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="direct" className="mt-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bmi-direct" className="sr-only">
                      Valor de IMC
                    </Label>
                    <Input
                      id="bmi-direct"
                      type="text"
                      inputMode="decimal"
                      value={form.bmi}
                      onChange={(e) => {
                        const sanitized = sanitizeNumericInput(
                          e.target.value,
                          true
                        );
                        update("bmi", sanitized);
                      }}
                      onBlur={() =>
                        setTouched((p) => ({ ...p, bmi: true }))
                      }
                      placeholder="ej. 27.5"
                    />
                    {touched.bmi && <FieldError message={errors.bmi} />}
                  </div>
                </TabsContent>

                <TabsContent value="calculate" className="mt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="height">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="text"
                        inputMode="numeric"
                        value={form.heightCm}
                        onChange={(e) => {
                          const sanitized = sanitizeNumericInput(
                            e.target.value,
                            false
                          );
                          update("heightCm", sanitized);
                        }}
                        onBlur={() =>
                          setTouched((p) => ({ ...p, heightCm: true }))
                        }
                        placeholder="ej. 170"
                      />
                      {touched.heightCm && (
                        <FieldError message={errors.heightCm} />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="text"
                        inputMode="numeric"
                        value={form.weightKg}
                        onChange={(e) => {
                          const sanitized = sanitizeNumericInput(
                            e.target.value,
                            false
                          );
                          update("weightKg", sanitized);
                        }}
                        onBlur={() =>
                          setTouched((p) => ({ ...p, weightKg: true }))
                        }
                        placeholder="ej. 70"
                      />
                      {touched.weightKg && (
                        <FieldError message={errors.weightKg} />
                      )}
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-secondary px-4 py-2.5 text-sm">
                    {"IMC calculado: "}
                    <span className="font-semibold text-primary">
                      {computedBmi}
                    </span>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Hijos */}
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium">
                {"Numero de Hijos"}
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9"
                  disabled={form.children <= 0}
                  onClick={() =>
                    update("children", Math.max(0, form.children - 1))
                  }
                  aria-label="Disminuir hijos"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-8 text-center text-lg font-semibold tabular-nums">
                  {form.children}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9"
                  disabled={form.children >= 5}
                  onClick={() =>
                    update("children", Math.min(5, form.children + 1))
                  }
                  aria-label="Aumentar hijos"
                >
                  <Plus className="size-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {"max. 5"}
                </span>
              </div>
            </div>

            {/* Fumador */}
            <div className="flex items-center justify-between rounded-lg border bg-secondary/50 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <Label
                  htmlFor="smoker"
                  className="text-sm font-medium cursor-pointer"
                >
                  Fumador
                </Label>
                <span className="text-xs text-muted-foreground">
                  {"Actualmente consumes tabaco?"}
                </span>
              </div>
              <Switch
                id="smoker"
                checked={form.smoker}
                onCheckedChange={(v) => update("smoker", v)}
              />
            </div>

            {/* Region - Mapa interactivo */}
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium">Region</Label>
              <USRegionMap
                value={form.region}
                onChange={(v) => update("region", v)}
              />
              {touched.region && <FieldError message={errors.region} />}
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" disabled={!isValid} className="flex-1 min-w-0">
                <ShieldCheck className="size-4 shrink-0" />
                <span className="truncate">Estimar Costo</span>
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} className="min-w-0 sm:w-auto">
                <RotateCcw className="size-4 shrink-0" />
                <span className="truncate">Reiniciar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Resultado */}
      {submitted && <ResultCard />}
    </div>
  );
}

function ResultCard() {
  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="size-5 text-primary" />
          Tu Estimacion
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-card border px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Costo Anual Estimado
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {"$\u2014"}
            </p>
          </div>
          <div className="rounded-lg bg-card border px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Costo Mensual Estimado
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {"$\u2014"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-secondary px-4 py-3 text-xs text-muted-foreground leading-relaxed">
          <Info className="size-4 mt-0.5 shrink-0 text-primary" />
          Esta es una interfaz de demostración. Las estimaciones finales seran
          proporcionadas por un modelo de ML.
        </div>
      </CardContent>
    </Card>
  );
}
