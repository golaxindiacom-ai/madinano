"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

export function NewsletterSubscribeForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await response.json();
      if (!response.ok || json?.success === false) {
        throw new Error(json?.error || "Subscribe failed");
      }
      setStatus("success");
      setMessage(json.data?.message || "Subscribed successfully.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Subscribe failed");
    }
  };

  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="min-w-0 flex-1 rounded-md border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/40"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-maroon px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
        >
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Subscribe
        </button>
      </form>
      {message ? (
        <p className={`mt-2 text-xs ${status === "error" ? "text-red-200" : "text-emerald-200"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
