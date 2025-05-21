"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OBSControlPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to new YouTube live-stream management
        router.replace("/admin/live-stream");
    }, [router]);

    return null;
}
