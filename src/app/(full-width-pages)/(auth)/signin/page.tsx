import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk — GROVE Analytics",
  description: "Halaman masuk dashboard GROVE",
};

export default function SignIn() {
  return <SignInForm />;
}
