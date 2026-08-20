import { redirect } from "next/navigation";

// Registration is closed: accounts are created by the GROVE admin in the
// Supabase dashboard (Authentication → Users).
export default function SignUp() {
  redirect("/signin");
}
