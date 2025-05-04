'use client';

export function Avatar() {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-300" />
  );
}

export function AvatarFallback() {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
      ?
    </div>
  );
}

export function AvatarImage() {
  return (
    <img
      className="w-10 h-10 rounded-full object-cover"
      src="/placeholder-avatar.png"
      alt="Avatar"
    />
  );
}
