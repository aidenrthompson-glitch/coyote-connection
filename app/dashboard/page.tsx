"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { isAllowedEmail } from "../../lib/authRules";

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const userEmail = data.user?.email ?? null;

      if (!userEmail) {
        window.location.href = "/sign-in";
        return;
      }

      if (!isAllowedEmail(userEmail)) {
        await supabase.auth.signOut();
        window.location.href = "/sign-in";
        return;
      }

      setEmail(userEmail);
      setLoading(false);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-purple-700 text-white p-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white/10 p-8 shadow">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-purple-700 text-white p-8 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top header card */}
        <div className="rounded-2xl bg-white/10 p-8 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">
                Dashboard
              </h1>
              <p className="mt-2 text-purple-200">
                Signed in as{" "}
                <span className="text-white font-semibold">{email}</span>
              </p>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
              <a
                href="/feed"
                className="rounded-xl bg-white px-5 py-2.5 font-semibold text-purple-800 hover:bg-purple-100"
              >
                Open Feed →
              </a>

              <a
                href="/profile"
                className="rounded-xl bg-white/10 px-5 py-2.5 font-semibold hover:bg-white/20"
              >
                Edit Profile
              </a>

              <button
                onClick={signOut}
                className="rounded-xl bg-white/10 px-5 py-2.5 font-semibold hover:bg-white/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1 */}
          <div className="rounded-2xl bg-white/10 p-8 shadow">
            <h2 className="text-xl font-semibold">What you can do now</h2>
            <ul className="mt-4 space-y-3 text-purple-100">
              <li className="rounded-xl bg-black/20 p-4">
                ✅ Update your profile (name, major, year, bio)
              </li>
              <li className="rounded-xl bg-black/20 p-4">
                ✅ Post to the global feed
              </li>
              <li className="rounded-xl bg-black/20 p-4">
                🔜 Add images & categories later
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl bg-white/10 p-8 shadow">
            <h2 className="text-xl font-semibold">Quick links</h2>

            <div className="mt-4 space-y-3">
              <a
                href="/feed"
                className="block rounded-xl bg-black/20 p-4 hover:bg-black/30"
              >
                <div className="font-semibold">Global Feed</div>
                <div className="text-sm text-purple-200">
                  Post updates, books for sale, events, anything.
                </div>
              </a>

              <a
                href="/profile"
                className="block rounded-xl bg-black/20 p-4 hover:bg-black/30"
              >
                <div className="font-semibold">Your Profile</div>
                <div className="text-sm text-purple-200">
                  Set your name, major, year, and bio.
                </div>
              </a>

              <a
                href="/sign-in"
                className="block rounded-xl bg-black/20 p-4 hover:bg-black/30"
              >
                <div className="font-semibold">Sign-in page</div>
                <div className="text-sm text-purple-200">
                  (Mostly for testing — dashboard should redirect you anyway.)
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="rounded-2xl bg-white/10 p-6 shadow">
          <p className="text-purple-200">
            Coyote Connection is live. Next, we’ll connect posts to profiles so
            the feed shows names instead of just timestamps.
          </p>
        </div>
      </div>
    </main>
  );
}
