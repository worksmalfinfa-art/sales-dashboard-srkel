"use client";
import React, { useActionState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { updateDisplayName } from "@/lib/auth-actions";

export default function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateDisplayName, null);

  return (
    <form action={action} className="max-w-md space-y-5">
      <div>
        <Label>Nama tampilan</Label>
        <Input name="name" type="text" defaultValue={name} />
        <p className="mt-1.5 text-theme-xs text-gray-400">
          Nama ini tampil di header dan dipakai aplikasi pengelolaan.
        </p>
      </div>
      {state?.error ? (
        <p className="text-sm text-error-500">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-success-600">Tersimpan.</p>
      ) : null}
      <Button size="sm" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
