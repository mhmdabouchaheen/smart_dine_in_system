// src/hooks/useCheckout.ts
import { useState } from 'react';
import { saveOrder } from '../services/ordersStore';
import type { OrderRecord } from '../types'; 

export type CheckoutStep = 'cart' | 'payment' | 'confirming' | 'success';

export const useCheckout = () => {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);

  const nextStep = (next: CheckoutStep) => setStep(next);

  const handleCheckout = async (data: any) => {
    setIsProcessing(true);
    try {
      // Calling the service directly and casting the data
      await saveOrder(data as OrderRecord); 
      setStep('success');
    } catch (error) {
      console.error("Checkout failed:", error);
      // Optional: Set an error state here to show a UI toast/message
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    step,
    isProcessing,
    nextStep,
    handleCheckout
  };
};