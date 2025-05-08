'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import UserMenu from './UserMenu';
import Navbar from './shared/Navbar';

export default function Header() {
  const { user } = useAuth();

  return (
    <header>
    <Navbar />
    </header>
  );
} 