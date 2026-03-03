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
import { useNovaStore, AI_PERSONAS } from "@/lib/nova-store";
import { useSession } from "next-auth/react";
import { Check, Crown, Zap, Building2, Users, MapPin, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PaymentDialog } from "./payment-dialog";

const plans = [
  {
    id: "pro",
    name: "Pro",
    price: 19,
    priceIdr: 299000,
    period: "/month",
    icon: <Crown className="w-5 h-5" />,
    features: [
      "Unlimited messages",
      "100 voice min/mo",
      "All 7 AIs",
      "Chat history saved",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    priceIdr: 1499000,
    period: "/month",
    icon: <Zap className="w-5 h-5" />,
    features: [
      "Everything in Pro",
      "Unlimited voice",
      "Custom AI training",
      "API access",
      "Dedicated support",
    ],
    popular: false,
  },
];

const paymentMethods = [
  // Indonesian
  { id: "midtrans", name: "Midtrans", icon: "🇮🇩", local: true, methods: "GoPay, OVO, DANA, QRIS, Bank Transfer" },
  { id: "xendit", name: "Xendit", icon: "💳", local: true, methods: "E-wallets, Virtual Account" },
  // International
  { id: "paypal", name: "PayPal", icon: "🅿️", local: false, methods: "PayPal, Credit Card" },
];

export function PricingDialog() {
  const { showPricing, setShowPricing, selectedPersona } = useNovaStore();
  const { data: session } = useSession();
  const currentPlan = (session?.user as { plan?: string })?.plan || "free";
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <>
      <Dialog open={showPricing} onOpenChange={setShowPricing}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-violet-500" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Unlock unlimited AI conversations with personal or group chat
            </DialogDescription>
          </DialogHeader>

          {/* Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {plans.map((plan, index) => {
              const isCurrentPlan = currentPlan === plan.id;
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "relative p-5 rounded-xl border-2 transition-all cursor-pointer",
                    plan.popular && !isCurrentPlan
                      ? "border-violet-500 bg-violet-500/5"
                      : "border-border bg-card",
                    isCurrentPlan && "ring-2 ring-green-500 border-green-500 bg-green-500/5"
                  )}
                  onClick={() => !isCurrentPlan && setSelectedPlan(plan.id)}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full whitespace-nowrap">
                      Current Plan
                    </div>
                  )}

                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-medium rounded-full whitespace-nowrap">
                      Popular
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3 mt-1">
                    <div
                      className={cn(
                        "p-1.5 rounded-lg",
                        isCurrentPlan
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : plan.popular
                            ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                            : "bg-muted"
                      )}
                    >
                      {plan.icon}
                    </div>
                    <h3 className="font-semibold">{plan.name}</h3>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <div className="flex items-baseline gap-1 text-sm text-muted-foreground">
                      <span>or Rp {plan.priceIdr.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      "w-full",
                      isCurrentPlan 
                        ? "bg-green-500 hover:bg-green-600"
                        : plan.popular 
                          ? "bg-gradient-to-r from-violet-500 to-purple-500" 
                          : ""
                    )}
                    variant={isCurrentPlan ? "default" : plan.popular ? "default" : "outline"}
                    disabled={isCurrentPlan}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCurrentPlan) setSelectedPlan(plan.id);
                    }}
                  >
                    {isCurrentPlan ? "Current Plan" : "Select Plan"}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Payment Methods */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium text-muted-foreground text-center mb-4">
              Available Payment Methods
            </p>
            
            {/* Indonesian */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <MapPin className="w-3 h-3" />
              <span>Indonesia</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {paymentMethods.filter(m => m.local).map((method) => (
                <div key={method.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                  <span className="text-lg">{method.icon}</span>
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.methods}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* International */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Globe className="w-3 h-3" />
              <span>International</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.filter(m => !m.local).map((method) => (
                <div key={method.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                  <span className="text-lg">{method.icon}</span>
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.methods}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Companions */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              All plans include these AI companions
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {AI_PERSONAS.map((ai) => (
                <div key={ai.id} className="flex flex-col items-center gap-0.5">
                  <div className={cn("w-9 h-9 rounded-full overflow-hidden border-2", `border-${ai.color}-500/30`)}>
                    <Image src={ai.avatar} alt={ai.name} width={36} height={36} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{ai.name}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        selectedPlanId={selectedPlan || ""}
      />
    </>
  );
}
