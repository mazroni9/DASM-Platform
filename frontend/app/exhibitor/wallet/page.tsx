'use client'

import { Header } from '../../../components/exhibitor/Header'
import { Sidebar } from '../../../components/exhibitor/sidebar'
import { ExhibitorBalance } from '../../../components/exhibitor/ExhibitorBalance'

export default function ExhibitorDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">
          <ExhibitorBalance />
        </main>
      </div>
    </div>
  )
}