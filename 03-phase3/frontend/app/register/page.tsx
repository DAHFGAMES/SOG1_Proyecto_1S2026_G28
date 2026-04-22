"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  UserPlus,
} from "lucide-react";
import { Button } from "../components/Button";
import { Card, CardBody, CardHeader } from "../components/Card";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "Ciudad de Guatemala",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setMessage(`Error: ${data.error}`);
      return;
    }
    setSuccess(true);
    setMessage(`Cliente creado con ID #${data.id}`);
    localStorage.setItem(
      "g28-customer",
      JSON.stringify({ id: data.id, name: form.name, email: form.email })
    );
    setTimeout(() => router.push("/checkout"), 1200);
  }

  function update<K extends keyof typeof form>(key: K, v: string) {
    setForm((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader
          title="Crear cuenta"
          subtitle="Registro como cliente en Odoo"
          icon={<UserPlus className="h-4 w-4" />}
        />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Nombre o empresa"
              icon={<Building2 className="h-4 w-4" />}
              value={form.name}
              onChange={(v) => update("name", v)}
              required
            />
            <Field
              label="Correo electrónico"
              icon={<Mail className="h-4 w-4" />}
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
            />
            <Field
              label="Teléfono"
              icon={<Phone className="h-4 w-4" />}
              value={form.phone}
              onChange={(v) => update("phone", v)}
            />
            <Field
              label="Dirección"
              icon={<MapPin className="h-4 w-4" />}
              value={form.street}
              onChange={(v) => update("street", v)}
            />
            <Field
              label="Ciudad"
              icon={<MapPin className="h-4 w-4" />}
              value={form.city}
              onChange={(v) => update("city", v)}
            />

            <Button
              type="submit"
              loading={loading}
              disabled={!form.name}
              size="lg"
              className="w-full"
              leftIcon={!loading ? <UserPlus className="h-4 w-4" /> : undefined}
            >
              Registrarme
            </Button>

            {message && (
              <div
                className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                  success
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {success && <CheckCircle2 className="h-4 w-4" />}
                {message}
              </div>
            )}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`h-10 w-full rounded-md border border-zinc-200 bg-white pr-3 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-400 ${
            icon ? "pl-9" : "pl-3"
          }`}
        />
      </div>
    </div>
  );
}
