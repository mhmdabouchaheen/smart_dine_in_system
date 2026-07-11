import { Request, Response } from 'express';
import { Reservation } from '../models/Reservation';
import { Table } from '../models/Table';

export const createReservation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      tableId,
      customerDetails,
      dateTime,
      partySize,
      notes,
    } = req.body;

    const table = await Table.findById(tableId);

    if (!table) {
      res.status(404).json({ error: 'Table not found' });
      return;
    }

    const reservation = await Reservation.create({
      tableId,
      customerDetails,
      dateTime,
      partySize,
      notes,
      status: 'Pending',
    });

    await Table.findByIdAndUpdate(tableId, {
      status: 'Reserved',
    });

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
};

export const getReservations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const reservations = await Reservation.find()
      .populate('tableId', 'tableNumber capacity status')
      .sort({ dateTime: 1 });

    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
};