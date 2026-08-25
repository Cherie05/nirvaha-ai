import { useState } from 'react';

export interface VendorSession {
  token: string;
  id: string;
  email: string;
  displayName: string;
  role: string;
}

/**
 * Vendor sign-in. Only VENDOR accounts get in — a household logging in here
 * would land on a routing console they have no business using, so the role is
 * checked before the session is stored.
 */
export default function Login({
  apiBaseUrl,
  headers,
  onLogin,
}: {
  apiBaseUrl: string;
  headers: Record<string, string>;
  onLogin: (s: VendorSession) => void;
}) {
  const [email, setEmail] = useState('vendor@gmail.com');
  const [password, setPassword] = useState('vendor@1234');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || 'Login failed');

      const u = body.user ?? {};
      if (u.role !== 'VENDOR') {
        throw new Error(
          'This account is a household, not a vendor. Use the Nirvaha app instead.',
        );
      }

      onLogin({
        token: body.access_token,
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
      });
    } catch (err: any) {
      setError(err?.message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  const field =
    'mt-1.5 w-full rounded-2xl border border-[#ecf0ee] bg-[#f6f8f7] px-4 py-3.5 text-sm font-semibold text-[#0b1f14] outline-none transition placeholder:font-normal placeholder:text-[#9aa8a1] focus:border-[#059669] focus:bg-white';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#d9eee3] via-[#e9f3ee] to-[#f4f6f5] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="Nirvaha"
            className="mx-auto h-20 w-20 rounded-full object-cover shadow-[0_14px_30px_-12px_rgba(6,95,70,0.6)]"
          />
          <h1 className="mt-5 text-[30px] font-extrabold leading-none text-[#0b1f14]">
            Nirvaha
          </h1>
          <p className="mt-2 text-sm text-[#6b7b72]">
            Collection partner console
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl bg-white p-7 shadow-[0_18px_40px_-12px_rgba(11,31,20,0.14)]"
        >
          <label className="block text-[12.5px] font-bold text-[#6b7b72]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            className={field}
          />

          <label className="mt-5 block text-[12.5px] font-bold text-[#6b7b72]">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={field}
          />

          {error && (
            <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className={`mt-7 w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition ${
              busy
                ? 'cursor-not-allowed bg-[#c8d2cd]'
                : 'bg-[#059669] shadow-[0_12px_24px_-10px_rgba(5,150,105,0.9)] hover:bg-[#047857]'
            }`}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11.5px] text-[#9aa8a1]">
          Tech for Good 2026 · GDG Coimbatore
        </p>
      </div>
    </div>
  );
}
