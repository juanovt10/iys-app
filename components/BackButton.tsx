"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BackButton({
  fallbackHref,
  label = "Atrás",
  className = "",
}: {
  fallbackHref: string; // where to go if there's no history
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  const onClick = () => {
    // if there's browser history, go back; otherwise, use the fallback
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Button variant="outline" className={`gap-1 ${className}`} onClick={onClick}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
