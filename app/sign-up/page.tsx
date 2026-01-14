"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { isAllowedEmail, ALLOWED_EMAIL_DOMAIN } from "../../lib/authRules";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!isAllowedEmail(normalizedEmail)) {
      setMsg(`Coyote Connection is restricted to C of I emails (${ALLOWED_EMAIL_DOMAIN}).`);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });
    setLoading(false);

    if (error) setMsg(error.message);
    else setMsg("Account created! Now sign in.");
  }

  return (
    <main className="min-h-screen bg-purple-700 text-white p-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white/10 p-8 shadow">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <p className="mt-2 text-purple-200">Coyote Connection</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl bg-white/10 p-3 outline-none placeholder:text-white/50"
            placeholder={`email (must end with ${ALLOWED_EMAIL_DOMAIN})`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            type="password"
            className="w-full rounded-xl bg-white/10 p-3 outline-none placeholder:text-white/50"
            placeholder="password (8+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          {msg && <p className="rounded-xl bg-black/20 p-3 text-sm">{msg}</p>}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white px-6 py-3 font-semibold text-purple-800 hover:bg-purple-100 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-purple-200">
          Already have an account?{" "}
          <a className="underline hover:text-white" href="/sign-in">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
