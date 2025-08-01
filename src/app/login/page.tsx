"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaGoogle, FaDiscord } from "react-icons/fa";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked:
      "That email is already linked with another provider. Please use the originally linked sign-in method.",
    AccessDenied: "Please use your school email.",
  };

  return (
    <div className="bg-base-200 flex min-h-screen items-center justify-center">
      <div>
        <h2 className="text-xl font-bold">Campus Connect Login</h2>
        {error && (
          <div className="mb-4 rounded border-2 border-black bg-red-200 p-4 text-red-800 shadow-[2px_2px_0px_0px_black]">
            {errorMessages[error] ??
              "An unexpected error occurred. Please try again."}
          </div>
        )}
        <button onClick={() => signIn("google")} className="btn btn-wide">
          <FaGoogle size={20} />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
