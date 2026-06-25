"use client";

import { useEffect, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const stripePromiseCache = new Map<string, ReturnType<typeof loadStripe>>();

function getStripePromise(publishableKey: string) {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }
  return stripePromiseCache.get(publishableKey)!;
}

export function TrialSignupStripeProvider({
  publishableKey,
  clientSecret,
  children,
}: {
  publishableKey: string;
  clientSecret: string;
  children: React.ReactNode;
}) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#0ea5e9",
        colorBackground: "#ffffff",
        colorText: "#334155",
        colorDanger: "#dc2626",
        borderRadius: "6px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        spacingUnit: "4px",
      },
      rules: {
        ".Input": {
          border: "1px solid #cbd5e1",
          boxShadow: "none",
          padding: "12px",
        },
        ".Input:focus": {
          border: "1px solid #0ea5e9",
          boxShadow: "0 0 0 1px #0ea5e9",
        },
        ".Label": {
          fontWeight: "500",
        },
      },
    },
  };

  return (
    <Elements stripe={getStripePromise(publishableKey)} options={options}>
      {children}
    </Elements>
  );
}

export function TrialSignupPaymentElement({
  className,
  onReadyChange,
  onCompleteChange,
  defaultEmail,
  defaultName,
  defaultPhone,
}: {
  className?: string;
  onReadyChange?: (ready: boolean) => void;
  onCompleteChange?: (complete: boolean) => void;
  defaultEmail?: string;
  defaultName?: string;
  defaultPhone?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onReadyChange?.(ready);
  }, [ready, onReadyChange]);

  const email = defaultEmail?.trim();
  const name = defaultName?.trim();
  const phone = defaultPhone?.trim();

  const billingDefaults =
    email || name || phone
      ? {
          billingDetails: {
            ...(email ? { email } : {}),
            ...(name ? { name } : {}),
            ...(phone ? { phone } : {}),
            address: { country: "US" },
          },
        }
      : undefined;

  return (
    <div className={cn("rounded-md border border-slate-200 bg-white", className)}>
      <PaymentElement
        onReady={() => setReady(true)}
        onChange={(event) => {
          onCompleteChange?.(event.complete);
        }}
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card"],
          business: {
            name: "Diazites",
          },
          wallets: {
            applePay: "never",
            googlePay: "never",
            link: "never",
          },
          ...(billingDefaults ? { defaultValues: billingDefaults } : {}),
        }}
      />
    </div>
  );
}

export function useTrialSignupPaymentConfirm() {
  const stripe = useStripe();
  const elements = useElements();

  async function confirmPayment(): Promise<
    { success: true; setupIntentId: string } | { success: false; error: string }
  > {
    if (!stripe || !elements) {
      return { success: false, error: "Payment form is still loading." };
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      return {
        success: false,
        error: submitError.message ?? "Please enter a valid card number.",
      };
    }

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/signup?step=2`,
      },
      redirect: "if_required",
    });

    if (error) {
      const message = error.message ?? "";
      const genericProcessingError = /processing error/i.test(message);
      return {
        success: false,
        error: genericProcessingError
          ? "Card setup could not be completed. Please use a card payment method only and try again."
          : message || "Card confirmation failed.",
      };
    }

    if (!setupIntent?.id || setupIntent.status !== "succeeded") {
      return { success: false, error: "Please enter your card information to continue." };
    }

    return { success: true, setupIntentId: setupIntent.id };
  }

  return { confirmPayment, stripeReady: Boolean(stripe) };
}

export function PaymentLoadingPlaceholder() {
  return (
    <div className="flex min-h-[52px] items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-3">
      <Loader2 className="size-5 animate-spin text-slate-400" aria-hidden />
      <span className="sr-only">Loading secure payment form…</span>
    </div>
  );
}
