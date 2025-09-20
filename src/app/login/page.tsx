"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl p-6 shadow">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={(e)=>{e.preventDefault(); signIn("email",{ email, callbackUrl:"/" });}} className="space-y-3">
        <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
               className="w-full rounded border px-3 py-2" placeholder="you@company.com" />
        <button className="w-full rounded bg-black text-white py-2">Send magic link</button>
      </form>
      <div className="mt-4 text-center">
        <button onClick={()=>signIn("google",{ callbackUrl:"/" })}
                className="text-sm underline">Sign in with Google</button>
      </div>
    </div>
  );
}
