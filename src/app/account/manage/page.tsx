import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";

const MENU_URL = "/biga-villanova/order";

export default function AccountManagePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
          <Link
            href={MENU_URL}
            className="text-primary font-medium hover:underline"
          >
            ← Torna al menù
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <UserProfile
          routing="path"
          path="/account/manage"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-border rounded-xl",
            },
          }}
        />
      </div>
    </div>
  );
}
