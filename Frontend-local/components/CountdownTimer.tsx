'use client'
import { useEffect, useState } from 'react'

export default function CountdownTimer() {
  const targetDate = new Date('2025-05-01T16:00:00+03:00').getTime()
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    setTimeLeft(targetDate - new Date().getTime())
    
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const difference = targetDate - now
      if (difference <= 0) {
        clearInterval(interval)
        setTimeLeft(0)
      } else {
        setTimeLeft(difference)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const days = Math.floor(totalSeconds / (3600 * 24))
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${seconds} ثانية / ${minutes} دقيقة / ${hours} ساعة / ${days} يوم`
  }

  if (timeLeft === null) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 text-center p-3 rounded-lg inline-block font-bold shadow animate-pulse">
      <p className="mb-1">العد التنازلي لانطلاق المنصة</p>
      <div className="text-lg font-extrabold tracking-wide" suppressHydrationWarning>
        {formatTime(timeLeft)}
      </div>
    </div>
  )
}
