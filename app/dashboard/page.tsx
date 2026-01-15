"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If somehow not logged in, your middleware/redirect should handle it,
      // but this keeps the UI from crashing.
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      setProfile(prof ?? null);
      setLoading(false);
    };

    run();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-purple-100">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-purple-200 bg-purple-50 flex items-center justify-center">
              <span className="text-purple-700 font-bold">C</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">Coyote Connection</div>
              <div className="text-xs text-gray-500">Dashboard</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
            ) : profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Your avatar"
                className="h-9 w-9 rounded-full object-cover border border-purple-200"
              />
            ) : (
              <div className="h-9 w-9 rounded-full border border-purple-200 bg-purple-50 flex items-center justify-center text-purple-700 font-semibold">
                {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Layout: left quick links + center card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left rail: Quick Links */}
          <aside className="md:col-span-4 lg:col-span-3">
            <div className="rounded-2xl border border-purple-100 bg-white shadow-sm">
              <div className="px-4 py-3 border-b border-purple-100">
                <h2 className="text-sm font-semibold text-gray-900">Quick Links</h2>
              </div>

              <nav className="p-2">
                <QuickLink href="/feed" label="Global Feed" />
                <QuickLink href="/profile" label="My Profile" />
                <QuickLink href="/dashboard" label="Dashboard" />
              </nav>
            </div>

            {/* Small secondary card (non-talky, clean) */}
            <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
              <div className="text-xs font-semibold text-purple-800">Account</div>
              <div className="mt-1 text-sm text-gray-900">
                {loading ? "Loading…" : profile?.full_name ?? "Student"}
              </div>
              <div className="mt-2 text-xs text-gray-600 break-all">
                {loading ? "" : profile?.id ?? ""}
              </div>
            </div>
          </aside>

          {/* Center: Main dashboard card */}
          <section className="md:col-span-8 lg:col-span-9">
            <div className="rounded-2xl border border-purple-100 bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-purple-100 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-600">
                    {loading ? "Loading…" : profile?.full_name ?? "Student"}
                  </p>
                </div>

                <Link
                  href="/feed"
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 active:bg-purple-800"
                >
                  Go to Feed
                </Link>
              </div>

              {/* Clean “Facebook-ish” content blocks (no assistant-y copy) */}
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard title="Posts" value="—" />
                  <StatCard title="Likes" value="—" />
                  <StatCard title="Comments" value="—" />
                </div>

                <div className="mt-5 rounded-2xl border border-purple-100 bg-white">
                  <div className="px-4 py-3 border-b border-purple-100">
                    <div className="text-sm font-semibold text-gray-900">Activity</div>
                    <div className="text-xs text-gray-600">Recent updates</div>
                  </div>

                  <div className="p-4 text-sm text-gray-600">
                    <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-4">
                      Nothing to show yet.
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/profile"
                    className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
                  >
                    Edit Profile
                  </Link>

                  <Link
                    href="/feed"
                    className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
                  >
                    View Feed
                  </Link>
                </div>
              </div>
            </div>

            {/* Optional: right-feel “card stack” vibe */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-purple-100 bg-white shadow-sm p-5">
                <div className="text-sm font-semibold text-gray-900">Campus</div>
                <div className="mt-2 text-sm text-gray-600">
                  Groups, events, and highlights can live here later.
                </div>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white shadow-sm p-5">
                <div className="text-sm font-semibold text-gray-900">Shortcuts</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <SmallButton href="/feed" label="Feed" />
                  <SmallButton href="/profile" label="Profile" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-gray-800 hover:bg-purple-50"
    >
      <span>{label}</span>
      <span className="text-purple-400">›</span>
    </Link>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4">
      <div className="text-xs font-semibold text-purple-700">{title}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-xs text-gray-500">—</div>
    </div>
  );
}

function SmallButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 text-center"
    >
      {label}
    </Link>
  );
}
