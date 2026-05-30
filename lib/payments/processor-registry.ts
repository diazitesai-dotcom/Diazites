import type { PaymentProcessor } from "@/types/merchant-services";

import type { PaymentProcessorInterface } from "@/lib/payments/processor-interface";
import { stripeProcessor } from "@/lib/payments/stripe-processor";

const PROCESSORS: Partial<Record<PaymentProcessor, PaymentProcessorInterface>> = {
  stripe: stripeProcessor,
};

export function getPaymentProcessor(processor: PaymentProcessor): PaymentProcessorInterface {
  const impl = PROCESSORS[processor];
  if (!impl) {
    throw new Error(`Payment processor "${processor}" is not yet implemented. Stripe is available now.`);
  }
  return impl;
}

export function isProcessorAvailable(processor: PaymentProcessor): boolean {
  return processor === "stripe" || processor === "external";
}

export function listAvailableProcessors(): PaymentProcessor[] {
  return (Object.keys(PROCESSORS) as PaymentProcessor[]).filter((p) => PROCESSORS[p] != null);
}
