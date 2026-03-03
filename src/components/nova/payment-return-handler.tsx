"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export function PaymentReturnHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading");
  
  const payment = searchParams.get("payment");
  const plan = searchParams.get("plan");
  const provider = searchParams.get("provider");
  const orderId = searchParams.get("token"); // PayPal returns token
  
  const isOpen = !!payment;

  useEffect(() => {
    if (!payment) return;

    const handlePayment = async () => {
      if (payment === "success") {
        // If PayPal, capture the payment
        if (provider === "paypal" && orderId && plan) {
          try {
            const response = await fetch("/api/payment/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId, plan }),
            });

            const data = await response.json();

            if (data.success) {
              setStatus("success");
              updateSession();
            } else {
              setStatus("error");
            }
          } catch (error) {
            console.error("PayPal capture error:", error);
            setStatus("error");
          }
        } else {
          setStatus("success");
          updateSession();
        }
      } else if (payment === "pending") {
        setStatus("pending");
      } else if (payment === "cancelled") {
        setStatus("error");
      } else {
        setStatus("error");
      }
    };

    handlePayment();
  }, [payment, provider, orderId, plan, updateSession]);

  const handleClose = () => {
    // Clear URL params
    router.replace("/");
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Payment Status</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {status === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />
              <p className="text-muted-foreground">Processing your payment...</p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold">Payment Successful!</h3>
              <p className="text-muted-foreground text-center">
                Your subscription has been activated. Enjoy your new features!
              </p>
              <Button onClick={handleClose} className="bg-green-500 hover:bg-green-600">
                Start Chatting
              </Button>
            </motion.div>
          )}

          {status === "pending" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold">Payment Pending</h3>
              <p className="text-muted-foreground text-center">
                Your payment is being processed. We will notify you once it&apos;s complete.
              </p>
              <Button onClick={handleClose}>Continue</Button>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold">Payment Failed</h3>
              <p className="text-muted-foreground text-center">
                Something went wrong with your payment. Please try again.
              </p>
              <Button onClick={handleClose} variant="destructive">
                Close
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
