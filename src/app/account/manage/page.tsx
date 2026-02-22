import { UserProfile } from "@clerk/nextjs";

export default function AccountManagePage() {
  return (
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
  );
}
