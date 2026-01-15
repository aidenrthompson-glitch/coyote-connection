"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";


type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Post = {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
};

export default function UserProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const run = async () => {
      setLoading(true);

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", id)
        .single();

      if (profErr) {
        console.error(profErr);
        setProfile(null);
        setPosts([]);
        setLoading(false);
        return;
      }

      setProfile(prof);

      const { data: userPosts, error: postsErr } = await supabase
        .from("posts")
        .select("id, content, image_url, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      if (postsErr) console.error(postsErr);

      setPosts(userPosts ?? []);
      setLoading(false);
    };

    run();
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!profile) return <div className="p-6">User not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/feed" className="underline opacity-80">
        ← Back to feed
      </Link>

      <div className="mt-6 flex items-center gap-4">
        {profile.avatar_url ? (
          // if your avatar_url is already a public URL
          <img
            src={profile.avatar_url}
            alt="avatar"
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center">
            ?
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold">
            {profile.full_name ?? "Student"}
          </h1>
          <p className="opacity-70 text-sm">{profile.id}</p>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Posts</h2>

      <div className="mt-4 space-y-4">
        {posts.length === 0 ? (
          <p className="opacity-70">No posts yet.</p>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="rounded-2xl p-4 bg-black/10">
              <div className="opacity-70 text-sm">
                {new Date(p.created_at).toLocaleString()}
              </div>
              {p.content && <p className="mt-2">{p.content}</p>}
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt="post"
                  className="mt-3 rounded-xl max-h-[420px] w-full object-cover"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
