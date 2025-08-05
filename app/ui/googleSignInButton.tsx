"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/app/ui/button";

export function GoogleSignInButton() {
  return (
    <form
      action={() =>
        signIn("google", {
          prompt: "select_account", // fuerza a elegir cuenta cada vez
          callbackUrl: "/dashboard", // redirige después de loguear
        })
      }
    >
      <Button
        type="submit"
        className="w-full bg-white text-black border border-gray-300 hover:bg-gray-100"
      >
        Sign in with Google
      </Button>
    </form>
  );
}
