"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { heading, btnPrimary, input } from "@/lib/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
          LP
        </span>
        <h1 className={`${heading} mt-4 text-xl`}>Staff Sign In</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll send you a magic link.
        </p>

        {status === "sent" ? (
          <p className="mt-6 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground">
            Check your email for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${input} w-full`}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className={`${btnPrimary} w-full`}
            >
              {status === "sending" ? "Sending..." : "Send magic link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-danger">{errorMessage}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
