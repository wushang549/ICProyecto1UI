"use client";

import { useState, useMemo, useCallback, useRef } from "react";
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
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Calculator,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

const NUMERIC_FIELD_CONFIG = {
  bmi: { min: 15, max: 60, allowDecimal: true, fallback: 27.5 },
  heightCm: { min: 120, max: 220, allowDecimal: false, fallback: 170 },
  weightKg: { min: 30, max: 200, allowDecimal: false, fallback: 70 },
} as const;

type NumericFieldKey = keyof typeof NUMERIC_FIELD_CONFIG;
const MODEL_PATH = "./models/individual_medical_cost_model.onnx";
const NEXT_BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? "";

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
  const [estimatedAnnualCost, setEstimatedAnnualCost] = useState<number | null>(
    null
  );
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [isInferencing, setIsInferencing] = useState(false);
  const sessionRef = useRef<import("onnxruntime-web").InferenceSession | null>(
    null
  );

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setTouched((prev) => ({ ...prev, [key]: true }));
    },
    []
  );

  const adjustNumericField = useCallback(
    (field: NumericFieldKey, delta: number) => {
      setForm((prev) => {
        const config = NUMERIC_FIELD_CONFIG[field];
        const current = Number.parseFloat(prev[field]);
        const base = Number.isFinite(current) ? current : config.fallback;
        const next = Math.min(config.max, Math.max(config.min, base + delta));
        const normalized = config.allowDecimal
          ? String(Math.round(next * 10) / 10)
          : String(Math.round(next));

        return { ...prev, [field]: normalized };
      });

      setTouched((prev) => ({ ...prev, [field]: true }));
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

  const runInference = useCallback(async () => {
    const ort = await import("onnxruntime-web");
    ort.env.logLevel = "error";
    ort.env.wasm.wasmPaths = `${NEXT_BASE_PATH}/onnx/`;

    if (!sessionRef.current) {
      sessionRef.current = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: ["wasm"],
      });
    }

    const modelBmi = form.bmiMode === "calculate" ? computedBmi : bmiNum;

    const feeds = {
      age: new ort.Tensor("float32", Float32Array.of(form.age), [1, 1]),
      bmi: new ort.Tensor("float32", Float32Array.of(modelBmi), [1, 1]),
      children: new ort.Tensor("float32", Float32Array.of(form.children), [1, 1]),
      sex: new ort.Tensor("string", [form.sex], [1, 1]),
      smoker: new ort.Tensor("string", [form.smoker ? "yes" : "no"], [1, 1]),
      region: new ort.Tensor("string", [form.region], [1, 1]),
    };

    const outputMap = await sessionRef.current.run(feeds);
    const outputTensor = outputMap[sessionRef.current.outputNames[0]];
    const firstValue = Number((outputTensor.data as ArrayLike<number>)[0]);

    if (!Number.isFinite(firstValue)) {
      throw new Error("Model output is not a finite number");
    }

    return firstValue;
  }, [form, computedBmi, bmiNum]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setTouched({
        age: true,
        bmi: true,
        heightCm: true,
        weightKg: true,
        region: true,
      });
      return;
    }

    setSubmitted(false);
    setInferenceError(null);
    setEstimatedAnnualCost(null);
    setIsInferencing(true);

    try {
      const prediction = await runInference();
      setEstimatedAnnualCost(prediction);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      setInferenceError(
        "No se pudo ejecutar la inferencia del modelo. Revisa el archivo ONNX e intenta de nuevo."
      );
    } finally {
      setIsInferencing(false);
    }
  };

  const handleReset = () => {
    setForm({ ...DEFAULTS });
    setTouched({});
    setSubmitted(false);
    setEstimatedAnnualCost(null);
    setInferenceError(null);
    setIsInferencing(false);
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
                    <div className="relative">
                      <Input
                        id="bmi-direct"
                        type="text"
                        inputMode="decimal"
                        className="pr-10"
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
                      <div className="absolute inset-y-1 right-1 flex flex-col">
                        <button
                          type="button"
                          className="flex h-3.5 w-6 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          onClick={() => adjustNumericField("bmi", 1)}
                          aria-label="Aumentar IMC en 1"
                        >
                          <ChevronUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          className="flex h-3.5 w-6 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          onClick={() => adjustNumericField("bmi", -1)}
                          aria-label="Disminuir IMC en 1"
                        >
                          <ChevronDown className="size-3" />
                        </button>
                      </div>
                    </div>
                    {touched.bmi && <FieldError message={errors.bmi} />}
                  </div>
                </TabsContent>

                <TabsContent value="calculate" className="mt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="height">Altura (cm)</Label>
                      <div className="relative">
                        <Input
                          id="height"
                          type="text"
                          inputMode="numeric"
                          className="pr-10"
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
                        <div className="absolute inset-y-1 right-1 flex flex-col">
                          <button
                            type="button"
                            className="flex h-3.5 w-6 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            onClick={() => adjustNumericField("heightCm", 1)}
                            aria-label="Aumentar altura en 1 cm"
                          >
                            <ChevronUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            className="flex h-3.5 w-6 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            onClick={() => adjustNumericField("heightCm", -1)}
                            aria-label="Disminuir altura en 1 cm"
                          >
                            <ChevronDown className="size-3" />
                          </button>
                        </div>
                      </div>
                      {touched.heightCm && (
                        <FieldError message={errors.heightCm} />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <div className="relative">
                        <Input
                          id="weight"
                          type="text"
                          inputMode="numeric"
                          className="pr-10"
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
                        <div className="absolute inset-y-1 right-1 flex flex-col">
                          <button
                            type="button"
                            className="flex h-3.5 w-6 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            onClick={() => adjustNumericField("weightKg", 1)}
                            aria-label="Aumentar peso en 1 kg"
                          >
                            <ChevronUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            className="flex h-3.5 w-6 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            onClick={() => adjustNumericField("weightKg", -1)}
                            aria-label="Disminuir peso en 1 kg"
                          >
                            <ChevronDown className="size-3" />
                          </button>
                        </div>
                      </div>
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
                  className="size-9 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
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
            <div
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3 transition-colors",
                form.smoker
                  ? "border-primary/35 bg-primary/10"
                  : "bg-secondary/50"
              )}
            >
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
              <Button
                type="submit"
                disabled={!isValid || isInferencing}
                className="flex-1 min-w-0"
              >
                <ShieldCheck className="size-4 shrink-0" />
                <span className="truncate">
                  {isInferencing ? "Calculando..." : "Estimar Costo"}
                </span>
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} className="min-w-0 sm:w-auto">
                <RotateCcw className="size-4 shrink-0" />
                <span className="truncate">Reiniciar</span>
              </Button>
            </div>
            {inferenceError && <FieldError message={inferenceError} />}
          </CardContent>
        </Card>
      </form>

      {/* Resultado */}
      {submitted && estimatedAnnualCost !== null && (
        <ResultCard
          annualCost={estimatedAnnualCost}
          isLoading={isInferencing}
          error={inferenceError}
        />
      )}
    </div>
  );
}

function ResultCard({
  annualCost,
  isLoading,
  error,
}: {
  annualCost: number | null;
  isLoading: boolean;
  error: string | null;
}) {
  const annualValue =
    annualCost !== null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(annualCost)
      : "$\u2014";

  const monthlyValue =
    annualCost !== null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 2,
        }).format(annualCost / 12)
      : "$\u2014";

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
              {annualValue}
            </p>
          </div>
          <div className="rounded-lg bg-card border px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Costo Mensual Estimado
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {monthlyValue}
            </p>
          </div>
        </div>
        {isLoading && (
          <p className="text-sm text-muted-foreground">
            Ejecutando inferencia del modelo...
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
