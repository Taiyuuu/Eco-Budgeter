"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Timer, X } from "lucide-react";

export default function RedirectTimer() {
  const [timeLeft, setTimeLeft] = useState(5);
  const [isCancelled, setIsCancelled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isCancelled) return;

    if (timeLeft <= 0) {
      router.push("/");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isCancelled, router]);

  if (isCancelled) {
    return (
      <div className="bg-muted text-sm p-3 px-5 rounded-md text-muted-foreground flex justify-between items-center animate-in fade-in duration-500">
        <div className="flex gap-3 items-center">
          <X size="16" strokeWidth={2} />
          <span>Redirection cancelled. You can stay on this page.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 border border-primary/20 text-sm p-3 px-5 rounded-md text-primary flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex gap-3 items-center">
        <Timer size="16" strokeWidth={2} className="animate-pulse" />
        <span>
          Redirecting to home in <span className="font-bold">{timeLeft}</span> seconds...
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsCancelled(true)}
        className="h-7 text-[10px] uppercase font-bold hover:bg-primary/20"
      >
        Cancel
      </Button>
    </div>
  );
}