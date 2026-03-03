"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerified: () => void;
}

export function VerificationDialog({
  isOpen,
  onClose,
  email,
  onVerified,
}: VerificationDialogProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus first input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      setCountdown(60); // Start 60 second countdown
    }
  }, [isOpen]);

  // Handle input change
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last digit
    setCode(newCode);
    setError("");

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every((digit) => digit !== "") && newCode.join("").length === 6) {
      handleVerify(newCode.join(""));
    }
  };

  // Handle key down for backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newCode[index] = char;
    });
    setCode(newCode);

    // Auto-submit if complete
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  // Verify the code
  const handleVerify = async (codeToVerify: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeToVerify }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        setError(data.error || "Invalid code");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Failed to verify. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    setIsResending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setCountdown(60);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || "Failed to resend code");
      }
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Mail className="w-5 h-5 text-violet-500" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription className="text-center">
            We sent a 6-digit code to
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {success ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-green-600 font-medium">Email Verified!</p>
            </motion.div>
          ) : (
            <>
              {/* Code Input */}
              <div className="flex gap-2 mb-4">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={isLoading}
                    className={cn(
                      "w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-violet-500",
                      error
                        ? "border-red-500 bg-red-500/10"
                        : digit
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-border bg-background"
                    )}
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mb-4"
                >
                  {error}
                </motion.p>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center gap-2 text-violet-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              )}

              {/* Resend Button */}
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn&apos;t receive the code?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={countdown > 0 || isResending}
                  className="gap-2"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Resend in {countdown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
