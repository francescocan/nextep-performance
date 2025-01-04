import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Portfolio Visualization</h1>
      <nav>
        <ul className="flex space-x-4">
          <li><Link href="/dashboard" className="text-blue-500 hover:text-blue-700">Dashboard</Link></li>
          <li><Link href="/projects" className="text-blue-500 hover:text-blue-700">Projects</Link></li>
          <li><Link href="/about" className="text-blue-500 hover:text-blue-700">About</Link></li>
        </ul>
      </nav>
    </main>
  )
}

