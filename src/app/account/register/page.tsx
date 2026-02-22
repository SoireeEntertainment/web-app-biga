import { redirect } from "next/navigation";

export default function RegisterLegacyRedirect() {
  redirect("/account/sign-up");
}
