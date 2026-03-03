"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PAYMENT_PLANS, PAYMENT_METHODS, type PaymentProvider } from "@/lib/payment-config";
import { useNovaStore } from "@/lib/nova-store";
import { useSession } from "next-auth/react";
import { Check, Loader2, CreditCard, Globe, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: string;
}

export function PaymentDialog({ isOpen, onClose, selectedPlanId }: PaymentDialogProps) {
  const { selectedPersona } = useNovaStore();
  const { data: session } = useSession();
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("midtrans");
  const [isLoading, setIsLoading] = useState(false);

  const plan = PAYMENT_PLANS.find((p) => p.id === selectedPlanId);

  const handlePayment = async () => {
    if (!plan) return;

    setIsLoading(true);

    try {
      // Call the appropriate payment API
      const response = await fetch(`/api/payment/${selectedProvider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          amount: selectedProvider === "midtrans" || selectedProvider === "xendit" 
            ? plan.priceIdr 
            : plan.price,
          currency: selectedProvider === "midtrans" || selectedProvider === "xendit" 
            ? "IDR" 
            : "USD",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to payment page
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else if (data.invoiceUrl) {
          window.location.href = data.invoiceUrl;
        } else if (data.redirect_url) {
          window.location.href = data.redirect_url;
        } else if (data.approveUrl) {
          window.location.href = data.approveUrl;
        }
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Payment
          </DialogTitle>
          <DialogDescription className="text-center">
            {plan.name} Plan - {selectedProvider === "midtrans" || selectedProvider === "xendit" 
              ? `Rp ${plan.priceIdr.toLocaleString("id-ID")} IDR`
              : `$${plan.price} USD`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Plan Summary */}
          <div className="p-4 rounded-xl bg-muted/50 border">
            <h3 className="font-semibold mb-2">{plan.name} Plan</h3>
            <ul className="space-y-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            {/* Indonesian Payments */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Indonesian Payment Methods</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(["midtrans", "xendit"] as PaymentProvider[]).map((provider) => {
                const method = PAYMENT_METHODS[provider];
                return (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-left transition-all",
                      selectedProvider === provider
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{method.displayName}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* International Payments */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
              <Globe className="w-4 h-4" />
              <span>International Payment Methods</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {(["paypal"] as PaymentProvider[]).map((provider) => {
                const method = PAYMENT_METHODS[provider];
                return (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-left transition-all",
                      selectedProvider === provider
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{method.displayName}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Display */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold">
                {selectedProvider === "midtrans" || selectedProvider === "xendit"
                  ? `Rp ${plan.priceIdr.toLocaleString("id-ID")}`
                  : `$${plan.price}`}
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className={cn(
              "w-full py-6 text-base bg-gradient-to-r",
              selectedPersona.gradient
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay with ${PAYMENT_METHODS[selectedProvider].displayName}`
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By completing this purchase, you agree to our Terms of Service
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
