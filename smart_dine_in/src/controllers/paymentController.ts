import { Request, Response } from 'express';
import { Payment } from '../models/Payment';

// Demo card processing endpoint. No real card details are charged or stored.
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, method, cardName, cardNumberLast4, reservationId, orderId } = req.body;
    const normalizedAmount = Number(amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      res.status(400).json({ error: 'Payment amount must be greater than zero.' });
      return;
    }

    if (String(method).toLowerCase() !== 'card') {
      res.status(400).json({ error: 'Only demo card payments are currently supported.' });
      return;
    }

    if (!cardName?.trim() || !/^\d{4}$/.test(String(cardNumberLast4))) {
      res.status(400).json({ error: 'Card name and last four digits are required.' });
      return;
    }

    const transactionId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const payment = await Payment.create({
      amount: normalizedAmount,
      method: 'Card',
      status: 'Completed',
      transactionId,
      cardName: cardName.trim(),
      cardNumberLast4: String(cardNumberLast4),
      reservationId: reservationId || undefined,
      orderId: orderId || undefined,
    });

    res.status(201).json({
      _id: payment._id,
      amount: payment.amount,
      method: 'card',
      cardName: payment.cardName,
      cardNumberLast4: payment.cardNumberLast4,
      reservationId: payment.reservationId,
      orderId: payment.orderId,
      status: 'succeeded',
      paidAt: payment.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
