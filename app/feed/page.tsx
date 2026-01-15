"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type PostRow = {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

export default function FeedPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  // composer
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  const canPost = useMemo(() => {
    return content.trim().length > 0 || !!file;
  }, [content, file]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", user.id)
          .single();

        setMe((prof as Profile) ?? null);
      } else {
        setMe(null);
      }

      const { data: postData } = await supabase
        .from("posts")
        .select(
          "id,user_id,content,image_url,created_at,profiles:profiles(id,full_name,avatar_url)"
        )
        .order("created_at", { ascending: false });

      setPosts((postData as any) ?? []);
      setLoading(false);
    };

    run();
  }, []);

  async function refreshPosts() {
    const { data: postData } = await supabase
      .from("posts")
      .select("id,user_id,content,image_url,created_at,profiles:profiles(id,full_name,avatar_url)")
      .order("created_at", { ascending: false });

    setPosts((postData as any) ?? []);
  }

  async function uploadPostImage(userId: string, f: File) {
    // Bucket name assumption: "post-images"
    // If yours is different, tell me what it is and I’ll swap it.
    const ext = f.name.split(".").pop() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("post-images")
      .upload(path, f, { upsert: false });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleCreatePost() {
    if (!me) return;
    if (!canPost) return;

    setPosting(true);
    try {
      let image_url: string | null = null;

      if (file) {
        image_url = await uploadPostImage(me.id, file);
      }

      const { error } = await supabase.from("posts").insert({
        user_id: me.id,
        content: content.trim() || null,
        image_url,
      });

      if (error) throw error;

      setContent("");
      setFile(null);
      await refreshPosts();
    } catch (e: any) {
      alert(e?.message ?? "Failed to post");
    } finally {
      setPosting(false);
    }
  }

  async function handleDeletePost(postId: string) {
    const ok = confirm("Delete this post?");
    if (!ok) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      alert(error.message);
      return;
    }
    await refreshPosts();
  }

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
              <div className="text-xs text-gray-500">Global Feed</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
            >
              Profile
            </Link>

            {me?.avatar_url ? (
              <img
                src={me.avatar_url}
                alt="Your avatar"
                className="ml-1 h-9 w-9 rounded-full object-cover border border-purple-200"
              />
            ) : (
              <div className="ml-1 h-9 w-9 rounded-full border border-purple-200 bg-purple-50 flex items-center justify-center text-purple-700 font-semibold">
                {me?.full_name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left rail: Quick links */}
          <aside className="md:col-span-4 lg:col-span-3">
            <div className="rounded-2xl border border-purple-100 bg-white shadow-sm">
              <div className="px-4 py-3 border-b border-purple-100">
                <h2 className="text-sm font-semibold text-gray-900">Quick Links</h2>
              </div>
              <nav className="p-2">
                <QuickLink href="/feed" label="Global Feed" active />
                <QuickLink href="/profile" label="My Profile" />
                <QuickLink href="/dashboard" label="Dashboard" />
              </nav>
            </div>

            <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
              <div className="text-xs font-semibold text-purple-800">Signed in as</div>
              <div className="mt-1 text-sm text-gray-900">{me?.full_name ?? "Student"}</div>
            </div>
          </aside>

          {/* Center feed column */}
          <section className="md:col-span-8 lg:col-span-9">
            {/* Composer */}
            <div className="rounded-2xl border border-purple-100 bg-white shadow-sm">
              <div className="p-4 flex gap-3">
                <div className="shrink-0">
                  {me?.avatar_url ? (
                    <img
                      src={me.avatar_url}
                      alt="Your avatar"
                      className="h-11 w-11 rounded-full object-cover border border-purple-200"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full border border-purple-200 bg-purple-50 flex items-center justify-center text-purple-700 font-semibold">
                      {me?.full_name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What’s on your mind?"
                    className="w-full resize-none rounded-2xl border border-purple-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    rows={3}
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50">
                        Add photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                      </label>

                      {file ? (
                        <div className="text-xs text-gray-600">
                          Selected: <span className="font-semibold">{file.name}</span>
                        </div>
                      ) : null}
                    </div>

                    <button
                      onClick={handleCreatePost}
                      disabled={!me || !canPost || posting}
                      className="rounded-xl border border-purple-200 bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed list */}
            <div className="mt-6 space-y-4">
              {loading ? (
                <>
                  <SkeletonPost />
                  <SkeletonPost />
                  <SkeletonPost />
                </>
              ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-purple-100 bg-white p-6 text-sm text-gray-600 shadow-sm">
                  No posts yet.
                </div>
              ) : (
                posts.map((p) => {
                  const authorName = p.profiles?.full_name ?? "Student";
                  const authorAvatar = p.profiles?.avatar_url ?? null;
                  const isMine = me?.id === p.user_id;

                  return (
                    <article
                      key={p.id}
                      className="rounded-2xl border border-purple-100 bg-white shadow-sm overflow-hidden"
                    >
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {authorAvatar ? (
                            <img
                              src={authorAvatar}
                              alt={authorName}
                              className="h-11 w-11 rounded-full object-cover border border-purple-200"
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-full border border-purple-200 bg-purple-50 flex items-center justify-center text-purple-700 font-semibold">
                              {authorName?.[0]?.toUpperCase() ?? "U"}
                            </div>
                          )}

                          <div className="leading-tight">
                            {/* Clickable author -> /u/[id] */}
                            <Link
                              href={`/u/${p.user_id}`}
                              className="text-sm font-semibold text-gray-900 hover:underline"
                            >
                              {authorName}
                            </Link>
                            <div className="text-xs text-gray-500">
                              {timeAgo(p.created_at)} •{" "}
                              <span className="text-purple-600">Public</span>
                            </div>
                          </div>
                        </div>

                        {isMine ? (
                          <button
                            onClick={() => handleDeletePost(p.id)}
                            className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>

                      {p.content ? (
                        <div className="px-4 pb-4 text-sm text-gray-800 whitespace-pre-wrap">
                          {p.content}
                        </div>
                      ) : null}

                      {p.image_url ? (
                        <div className="border-t border-purple-100 bg-white">
                          <img
                            src={p.image_url}
                            alt="Post image"
                            className="w-full max-h-[520px] object-cover"
                          />
                        </div>
                      ) : null}

                      {/* Actions row (FB feel; no likes yet) */}
                      <div className="px-4 py-3 border-t border-purple-100 flex items-center justify-between text-sm">
                        <button className="rounded-xl px-3 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-700">
                          Like
                        </button>
                        <button className="rounded-xl px-3 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-700">
                          Comment
                        </button>
                        <button className="rounded-xl px-3 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-700">
                          Share
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function QuickLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium",
        active
          ? "bg-purple-50 text-purple-800"
          : "text-gray-800 hover:bg-purple-50",
      ].join(" ")}
    >
      <span>{label}</span>
      <span className="text-purple-400">›</span>
    </Link>
  );
}

function SkeletonPost() {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-gray-100 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
          <div className="mt-2 h-3 w-28 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="mt-4 h-4 w-full bg-gray-100 rounded animate-pulse" />
      <div className="mt-2 h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
      <div className="mt-4 h-48 w-full bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );
}
