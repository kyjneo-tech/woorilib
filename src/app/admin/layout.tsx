
import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">Admin Center</h1>
          <p className="text-sm text-gray-500">큐레이션 관제탑</p>
        </div>
        <nav className="p-4 space-y-2">
          <NavLink href="/admin/dashboard" icon="📊">Dashboard</NavLink>
          <NavLink href="/admin/books" icon="📚">Books Management</NavLink>
          <NavLink href="/admin/simulation" icon="🧪">Simulator</NavLink>
          <NavLink href="/admin/operations" icon="🛠️">Operations</NavLink>
          <div className="pt-4 border-t mt-4">
            <NavLink href="/" icon="🏠">Back to App</NavLink>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
      <span className="mr-3">{icon}</span>
      {children}
    </Link>
  );
}
