"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { isAllowedEmail } from "../../lib/authRules";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  major: string | null;
  grad_year: number | null;
  bio: string | null;
  avatar_url?: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function loadOrCreateProfile() {
    setMsg(null);
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user?.email) {
      window.location.href = "/sign-in";
      return;
    }

    if (!isAllowedEmail(user.email)) {
      await supabase.auth.signOut();
      window.location.href = "/sign-in";
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,major,grad_year,bio,avatar_url")
      .eq("id", user.id)
      .single();

    // If missing, create it
    if (error && (error as any).code === "PGRST116") {
      const { error: insertErr } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        full_name: "",
        major: "",
        grad_year: null,
        bio: "",
        avatar_url: null,
      });

      if (insertErr) {
        setMsg(insertErr.message);
        setLoading(false);
        return;
      }

      const { data: fresh, error: freshErr } = await supabase
        .from("profiles")
        .select("id,email,full_name,major,grad_year,bio,avatar_url")
        .eq("id", user.id)
        .single();

      if (freshErr) setMsg(freshErr.message);
      else setProfile(fresh as Profile);

      setLoading(false);
      return;
    }

    if (error) setMsg(error.message);
    else setProfile(data as Profile);

    setLoading(false);
  }

  useEffect(() => {
    loadOrCreateProfile();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user || !profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        major: profile.major,
        grad_year: profile.grad_year,
        bio: profile.bio,
      })
      .eq("id", user.id);

    if (error) setMsg(error.message);
    else {
      setMsg("Saved ✅");
      setTimeout(() => setMsg(null), 2500);
    }
  }

  async function uploadAvatar(file: File) {
    setMsg(null);
    setUploading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setUploading(false);
      window.location.href = "/sign-in";
      return;
    }

    // simple file validation
    if (!file.type.startsWith("image/")) {
      setUploading(false);
      setMsg("Please choose an image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploading(false);
      setMsg("Image is too big. Max 3MB.");
      return;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setUploading(false);
      setMsg(uploadErr.message);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const avatarUrl = publicData.publicUrl;

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    setUploading(false);

    if (updateErr) {
      setMsg(updateErr.message);
      return;
    }

    setProfile((p) => (p ? { ...p, avatar_url: avatarUrl } : p));
    setMsg("Avatar updated ✅");
    setTimeout(() => setMsg(null), 2500);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-purple-700 text-white p-10">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white/10 p-8 shadow">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-purple-700 text-white p-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white/10 p-8 shadow">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="mt-2 text-purple-200">{profile?.email}</p>

        {/* Avatar section */}
        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-black/20 p-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-white/10">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-purple-200">
                ?
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="font-semibold">Profile picture</p>
            <p className="text-sm text-purple-200">
              Upload a square image for best results (max 3MB).
            </p>
          </div>

          <label className="cursor-pointer rounded-xl bg-white px-4 py-2 font-semibold text-purple-800 hover:bg-purple-100">
            {uploading ? "Uploading..." : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
              }}
              disabled={uploading}
            />
          </label>
        </div>

        <form onSubmit={saveProfile} className="mt-8 space-y-4">
          <input
            className="w-full rounded-xl bg-white/10 p-3 outline-none placeholder:text-white/50"
            placeholder="Full name"
            value={profile?.full_name ?? ""}
            onChange={(e) =>
              setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))
            }
          />

          <input
            className="w-full rounded-xl bg-white/10 p-3 outline-none placeholder:text-white/50"
            placeholder="Major"
            value={profile?.major ?? ""}
            onChange={(e) =>
              setProfile((p) => (p ? { ...p, major: e.target.value } : p))
            }
          />

          <input
            type="number"
            min={2000}
            max={2100}
            className="w-full rounded-xl bg-white/10 p-3 outline-none placeholder:text-white/50"
            placeholder="Graduation year (e.g., 2028)"
            value={profile?.grad_year ?? ""}
            onChange={(e) =>
              setProfile((p) =>
                p
                  ? {
                      ...p,
                      grad_year: e.target.value ? Number(e.target.value) : null,
                    }
                  : p
              )
            }
          />

          <textarea
            className="w-full rounded-xl bg-white/10 p-3 outline-none placeholder:text-white/50"
            placeholder="Bio"
            rows={4}
            value={profile?.bio ?? ""}
            onChange={(e) =>
              setProfile((p) => (p ? { ...p, bio: e.target.value } : p))
            }
          />

          {msg && <p className="rounded-xl bg-black/20 p-3 text-sm">{msg}</p>}

          <button className="w-full rounded-xl bg-white px-6 py-3 font-semibold text-purple-800 hover:bg-purple-100">
            Save Profile
          </button>
        </form>

        <a
          className="mt-6 block text-center underline text-purple-200 hover:text-white"
          href="/dashboard"
        >
          Back to Dashboard
        </a>
      </div>
    </main>
  );
}
