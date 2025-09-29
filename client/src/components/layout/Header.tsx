import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b bg-white">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-lg font-bold">InsureLink</Link>
        <div className="flex gap-4 text-sm">
          <Link href="/patient/dashboard">Patient</Link>
          <Link href="/hospital/dashboard">Hospital</Link>
          <Link href="/insurer/dashboard">Insurer</Link>
          <Link href="/corporate/dashboard">Corporate</Link>
          <Link href="/(auth)/login">Sign in</Link>
        </div>
      </nav>
    </header>
  );
}

