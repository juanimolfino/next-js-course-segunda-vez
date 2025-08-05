'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function MaginLinkForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Enviando...");
    const res = await signIn("email", { email, redirect: false });
    if (res?.ok) {
      setStatus("Revisa tu email para iniciar sesión.");
    } else {
      setStatus("Error al enviar el Magic Link.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Tu email"
        className="border p-2 w-full"
        required
      />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Enviar Magic Link
      </button>
      {status && <p>{status}</p>}
    </form>
  );
}
