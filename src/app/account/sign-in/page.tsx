import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <SignIn
        signUpUrl="/account/sign-up"
        afterSignInUrl="/account"
        fallbackRedirectUrl="/account"
      />
    </div>
  );
}
