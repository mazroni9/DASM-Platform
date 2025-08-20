'use client'

import { Header } from '../../../components/exhibitor/Header'
import { Sidebar } from '../../../components/exhibitor/sidebar'
import { ExhibitorRatings } from '../../../components/exhibitor/ExhibitorRatings'

export default function ExhibitorDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">
          <ExhibitorRatings />
        </main>
      </div>
    </div>
  )
}