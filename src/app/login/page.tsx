'use client';

import AuthComponent from '@/components/Auth';

export default function Login() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-3xl font-bold mb-8">Login to Better Life Diet Plan</h1>
      <div className="w-full max-w-md">
        <AuthComponent />
      </div>
    </main>
  );
} 