import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <SignUp
        signInUrl="/account/sign-in"
        afterSignUpUrl="/account"
        fallbackRedirectUrl="/account"
      />
    </div>
  );
}
