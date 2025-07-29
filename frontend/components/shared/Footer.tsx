import Link from "next/link";
import {
    Facebook,
    Twitter,
    Instagram,
    Mail,
    Phone,
    MapPin,
} from "lucide-react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            className="bg-sky-100 text-sky-900 text-sm border-t border-sky-200"
            dir="rtl"
        >
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
                {/* Desktop Layout */}
                <div className="hidden lg:flex justify-between items-center">
                    <div className="w-1/3 flex justify-start gap-4">
                        <Link
                            href="/about"
                            className="text-sky-800 hover:text-sky-600 transition-colors"
                        >
                            من نحن
                        </Link>
                        <span className="text-sky-300">|</span>
                        <Link
                            href="/how-it-works"
                            className="text-sky-800 hover:text-sky-600 transition-colors"
                        >
                            كيف نعمل
                        </Link>
                        <span className="text-sky-300">|</span>
                        <Link
                            href="/privacy"
                            className="text-sky-800 hover:text-sky-600 transition-colors"
                        >
                            سياسة الخصوصية
                        </Link>
                        <span className="text-sky-300">|</span>
                        <Link
                            href="/terms"
                            className="text-sky-800 hover:text-sky-600 transition-colors"
                        >
                            الشروط والأحكام
                        </Link>
                    </div>
                    <div className="w-1/3 text-center text-sky-700">
                        © {currentYear} منصة DASM-e. جميع الحقوق محفوظة.
                    </div>
                    <div className="w-1/3 flex justify-end">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-sky-700" />
                            <span className="text-sky-800">
                                zahrma0p@yahoo.com
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tablet Layout */}
                <div className="hidden md:flex lg:hidden flex-col gap-4">
                    {/* Navigation Links */}
                    <div className="flex justify-center items-center gap-3 flex-wrap">
                        <Link
                            href="/about"
                            className="text-sky-800 hover:text-sky-600 transition-colors"
                        >
                            من نحن
                        </Link>
                        <span className="text-sky-300">|</span>
                        <Link
                            href="/how-it-works"
                            className="text-sky-800 hover:text-sky-600 transition-colors"
                        >
                            كيف نعمل
                        </Link>
                        <span className="text-sky-300">|</span>
                        <Link
                            href="/privacy"
                            className="text-sky-800 hover:text-sky-600 transition-colors"
                        >
                            سياسة الخصوصية
                        </Link>
                        <span className="text-sky-300">|</span>
                        <Link
                            href="/terms"
                            className="text-sky-800 hover:text-sky-600 transition-colors"
                        >
                            الشروط والأحكام
                        </Link>
                    </div>
                    
                    {/* Bottom Row */}
                    <div className="flex justify-between items-center">
                        <div className="text-sky-700">
                            © {currentYear} منصة DASM-e. جميع الحقوق محفوظة.
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-sky-700" />
                            <span className="text-sky-800 text-xs sm:text-sm">
                                zahrma0p@yahoo.com
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="flex md:hidden flex-col gap-4">
                    {/* Navigation Links - Mobile Grid */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <Link
                            href="/about"
                            className="text-sky-800 hover:text-sky-600 transition-colors py-2 px-1 rounded hover:bg-sky-50"
                        >
                            من نحن
                        </Link>
                        <Link
                            href="/how-it-works"
                            className="text-sky-800 hover:text-sky-600 transition-colors py-2 px-1 rounded hover:bg-sky-50"
                        >
                            كيف نعمل
                        </Link>
                        <Link
                            href="/privacy"
                            className="text-sky-800 hover:text-sky-600 transition-colors py-2 px-1 rounded hover:bg-sky-50"
                        >
                            سياسة الخصوصية
                        </Link>
                        <Link
                            href="/terms"
                            className="text-sky-800 hover:text-sky-600 transition-colors py-2 px-1 rounded hover:bg-sky-50"
                        >
                            الشروط والأحكام
                        </Link>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="flex justify-center items-center gap-2 py-2 border-t border-sky-200">
                        <Mail className="h-4 w-4 text-sky-700 flex-shrink-0" />
                        <span className="text-sky-800 text-xs break-all">
                            zahrma0p@yahoo.com
                        </span>
                    </div>
                    
                    {/* Copyright */}
                    <div className="text-center text-sky-700 text-xs border-t border-sky-200 pt-3">
                        © {currentYear} منصة DASM-e
                        <br className="sm:hidden" />
                        <span className="hidden sm:inline"> - </span>
                        جميع الحقوق محفوظة
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
