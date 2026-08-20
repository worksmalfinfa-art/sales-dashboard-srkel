"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import React, { useActionState, useState } from "react";
import { signIn } from "@/lib/auth-actions";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              GROVE Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Masuk dengan akun yang terdaftar untuk melihat dashboard.
            </p>
          </div>
          <form action={action}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input name="email" placeholder="nama@perusahaan.com" type="email" />
              </div>
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              {state?.error ? (
                <p className="rounded-lg border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                  {state.error}
                </p>
              ) : null}
              <div>
                <Button className="w-full" size="sm" disabled={pending}>
                  {pending ? "Memeriksa…" : "Masuk"}
                </Button>
              </div>
            </div>
          </form>
          <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
            Belum punya akses? Hubungi pengelola GROVE — pendaftaran mandiri
            tidak dibuka.
          </p>
        </div>
      </div>
    </div>
  );
}
