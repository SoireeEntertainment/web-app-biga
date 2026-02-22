import { redirect } from "next/navigation";

export default function LoginLegacyRedirect() {
  redirect("/account/sign-in");
}
