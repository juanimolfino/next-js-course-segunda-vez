"use client";

import { useSession } from "next-auth/react";

export function UserGreeting() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (!session?.user?.email) return <p>No estás logueado.</p>;

  return <p>Hola, {session.user.name}!</p>;
}
