import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  CreditCard,
  File,
  FileText,
  HelpCircle,
  Image,
  Laptop,
  Loader2,
  LucideProps,
  Moon,
  MoreVertical,
  Pizza,
  Plus,
  Settings,
  SunMedium,
  Trash,
  User,
  X,
  Github,
  Twitter,
  CheckCircle,
  Menu,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { Atom } from "lucide-react";
import { Circle } from "lucide-react";
import { Upload } from "lucide-react";

export type IconProps = React.HTMLAttributes<SVGElement>;

// Define Icon type directly instead of importing it
export type Icon = React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;

export const Icons = {
  logo: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  spinner: Loader2,
  close: X,
  copy: Copy,
  clipboardCheck: ClipboardCheck,
  file: File,
  fileText: FileText,
  help: HelpCircle,
  laptop: Laptop,
  moon: Moon,
  pizza: Pizza,
  settings: Settings,
  sun: SunMedium,
  trash: Trash,
  user: User,
  add: Plus,
  warning: AlertTriangle,
  check: Check,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  more: MoreVertical,
  upload: Upload,
  circle: Circle,
  google: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      />
    </svg>
  ),
  twitter: Twitter,
  github: Github,
  gitHub: Github,
  image: Image,
  creditCard: CreditCard,
  checkCircle: CheckCircle,
  menu: Menu,
  dashboard: LayoutDashboard,
  logout: LogOut,
}; 