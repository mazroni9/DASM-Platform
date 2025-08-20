'use client'

import { Header } from '../../../components/exhibitor/Header'
import { Sidebar } from '../../../components/exhibitor/sidebar'
import {FinancialDashboard} from '../../../components/exhibitor/FinancialDashboard'

export default function ExhibitorDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">
          <FinancialDashboard />
        </main>
      </div>
    </div>
  )
}