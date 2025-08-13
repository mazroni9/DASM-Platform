import { useEffect, useState } from "react";

interface CountdownProps {
  page: 'live_auction' | 'instant_auction' | 'late_auction';
}

const pageTimeRanges: Record<string, { start: string; end: string }[]> = {
  live_auction: [{ start: '16:00:00', end: '18:59:59' }],
  instant_auction: [{ start: '19:00:00', end: '21:59:59' }],
  late_auction: [{ start: '22:00:00', end: '15:59:59' }], // overnight
};

const Countdown: React.FC<CountdownProps> = ({ page }) => {
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const ranges = pageTimeRanges[page];

      let ongoingEnd: Date | null = null;

      for (const range of ranges) {
        let start = new Date(`${today}T${range.start}`);
        let end = new Date(`${today}T${range.end}`);

        // Handle overnight ranges
        if (end <= start) {
          end.setDate(end.getDate() + 1);
        }

        if (now >= start && now <= end) {
          ongoingEnd = end;
          break;
        }
      }

      if (ongoingEnd) {
        const diff = ongoingEnd.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Format with Arabic labels
        const formatted = `${hours} ساعة : ${minutes} دقيقة : ${seconds} ثانية`;
        setRemainingTime(formatted);
      } else {
        setRemainingTime(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [page]);

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-3 rounded-2xl shadow-lg 
                    bg-gradient-to-r from-purple-400 to-pink-500 text-white w-60 mx-auto">
      {remainingTime ? (
        <div className="text-1xl font-bold text-gray-200 animate-pulse">
          {remainingTime}
        </div>
      ) : (
        <div className="text-1xl font-bold text-gray-200 animate-pulse">
          مغلق المزاد الان
        </div>
      )}
    </div>
  );
};

export default Countdown;
