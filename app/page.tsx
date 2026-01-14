import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-purple-700 text-white p-10">
      <h1 className="text-5xl font-bold">Coyote Connection</h1>
      <p className="mt-4 text-lg text-purple-200">
        If you can read this, you’re officially in control.
      </p>

      <div className="mt-10 flex gap-4">
        <Link
          href="/sign-up"
          className="rounded-xl bg-white/15 px-6 py-3 font-semibold hover:bg-white/25"
        >
          Get Started
        </Link>

        <Link
          href="/sign-in"
          className="rounded-xl bg-white px-6 py-3 font-semibold text-purple-800 hover:bg-purple-100"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
