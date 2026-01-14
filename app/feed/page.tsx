"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { isAllowedEmail } from "../../lib/authRules";

type ProfileMini = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type PostRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  image_url: string | null;
  profiles: ProfileMini | null; // joined profile
};

export default function FeedPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  async function loadPosts() {
    setMsg(null);

    // IMPORTANT: this requires a relationship between posts.user_id -> profiles.id
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id,user_id,content,created_at,image_url,profiles(id,full_name,avatar_url)"
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setMsg(error.message);
    } else {
      const rows = (data ?? []) as unknown as PostRow[];
      setPosts(rows);
    }
  } // ✅ THIS WAS MISSING

  useEffect(() => {
    (async () => {
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

      setEmail(user.email);
      setUserId(user.id);

      await loadPosts();
      setLoading(false);
    })();
  }, []);

  async function uploadPostImage(uid: string, file: File) {
    if (!file.type.startsWith("image/"))
      throw new Error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Image too big. Max 5MB.");

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const path = `${uid}/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from("post-images")
      .upload(path, file);

    if (uploadErr) throw new Error(uploadErr.message);

    const { data: publicData } = supabase.storage
      .from("post-images")
      .getPublicUrl(path);

    return publicData.publicUrl;
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const text = content.trim();
    if (!text && !imageFile) {
      setMsg("Write something or add a picture.");
      return;
    }
    if (text.length > 400) {
      setMsg("Keep it under 400 characters for now.");
      return;
    }

    setPosting(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setPosting(false);
      window.location.href = "/sign-in";
      return;
    }

    let imageUrl: string | null = null;

    try {
      if (imageFile) imageUrl = await uploadPostImage(user.id, imageFile);
    } catch (err: any) {
      setPosting(false);
      setMsg(err.message ?? "Image upload failed.");
      return;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: text,
      image_url: imageUrl,
    });

    setPosting(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setContent("");
    setImageFile(null);
    await loadPosts();
  }

  async function deletePost(postId: string) {
    if (!confirm("Delete this post?")) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) setMsg(error.message);
    else {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setMsg("Deleted ✅");
      setTimeout(() => setMsg(null), 2000);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-purple-700 text-white p-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white/10 p-8 shadow">
          Loading feed...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-purple-700 text-white p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl bg-white/10 p-8 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Global Feed</h1>
              <p className="mt-2 text-purple-200">Signed in as: {email}</p>
            </div>

            <div className="flex gap-3">
              <a
                href="/profile"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                Profile
              </a>
              <a
                href="/dashboard"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                Dashboard
              </a>
              <button
                onClick={signOut}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-purple-800 hover:bg-purple-100"
              >
                Sign out
              </button>
            </div>
          </div>

          <form onSubmit={createPost} className="mt-6 space-y-3">
            <textarea
              className="w-full rounded-xl bg-white/10 p-4 outline-none placeholder:text-white/50"
              placeholder="Post something to the Coyote Connection..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="cursor-pointer rounded-xl bg-black/20 px-4 py-3 text-sm hover:bg-black/30">
                {imageFile ? `Image: ${imageFile.name}` : "Add a picture (optional)"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-purple-200">{content.length}/400</p>
                <button
                  disabled={posting}
                  className="rounded-xl bg-white px-6 py-3 font-semibold text-purple-800 hover:bg-purple-100 disabled:opacity-60"
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </form>

          {msg && <p className="mt-4 rounded-xl bg-black/20 p-3 text-sm">{msg}</p>}
        </div>

        <div className="rounded-2xl bg-white/10 p-8 shadow">
          <h2 className="text-xl font-semibold">Recent posts</h2>

          <div className="mt-4 space-y-4">
            {posts.length === 0 ? (
              <p className="text-purple-200">No posts yet. Be the first.</p>
            ) : (
              posts.map((p) => {
                const name = p.profiles?.full_name?.trim() || "Student";

                return (
                  <div key={p.id} className="rounded-xl bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-white/10">
                          {p.profiles?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.profiles.avatar_url}
                              alt="avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-purple-200">
                              ?
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold">{name}</p>
                          <p className="text-xs text-purple-200">
                            {new Date(p.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {userId === p.user_id && (
                        <button
                          onClick={() => deletePost(p.id)}
                          className="rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/20"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt="post"
                        className="mb-3 w-full rounded-xl object-cover"
                      />
                    )}

                    {p.content && (
                      <p className="whitespace-pre-wrap">{p.content}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
