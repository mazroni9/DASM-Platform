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
        <footer className="bg-sky-100 text-sky-900 text-sm border-t border-sky-200" dir="rtl">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <div className="w-1/3 flex justify-start gap-4">
                        <Link href="/privacy" className="text-sky-800 hover:text-sky-600 transition-colors">
                            سياسة الخصوصية
                        </Link>
                        <span className="text-sky-300">|</span>
                        <Link href="/terms" className="text-sky-800 hover:text-sky-600 transition-colors">
                            الشروط والأحكام
                        </Link>
                        <span className="text-sky-300">|</span>
                        <Link href="/how-it-works" className="text-sky-800 hover:text-sky-600 transition-colors">
                            كيف نعمل
                        </Link>
                    </div>
                    <div className="w-1/3 text-center text-sky-700">
                        © {currentYear} منصة قلب. جميع الحقوق محفوظة.
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
            </div>
        </footer>
    );
};

export default Footer;
