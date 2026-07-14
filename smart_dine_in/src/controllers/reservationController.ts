import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Reservation } from '../models/Reservation';
import { Table } from '../models/Table';

const SLOT_DURATION_MS = 2 * 60 * 60 * 1000;
const OPENING_HOUR = 12;
const CLOSING_HOUR = 22;

const overlapsExistingReservation = async (tableId: mongoose.Types.ObjectId, dateTime: Date) => {
  const start = new Date(dateTime.getTime() - SLOT_DURATION_MS + 1);
  const end = new Date(dateTime.getTime() + SLOT_DURATION_MS - 1);
  return Reservation.exists({
    tableId,
    status: { $nin: ['Cancelled', 'No Show'] },
    dateTime: { $gte: start, $lte: end },
  });
};

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableId, date } = req.query;
    if (!tableId || !date || !mongoose.isValidObjectId(String(tableId))) {
      res.status(400).json({ error: 'Valid tableId and date are required.' });
      return;
    }
    const dayStart = new Date(`${String(date)}T00:00:00`);
    if (Number.isNaN(dayStart.getTime())) {
      res.status(400).json({ error: 'Invalid date.' });
      return;
    }
    const reservations = await Reservation.find({
      tableId: String(tableId),
      status: { $nin: ['Cancelled', 'No Show'] },
      dateTime: { $gte: dayStart, $lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) },
    }).select('dateTime');
    const slots = [];
    for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
      for (const minute of [0, 30]) {
        const slot = new Date(dayStart);
        slot.setHours(hour, minute, 0, 0);
        const available = slot.getTime() >= Date.now() && !reservations.some((r) => Math.abs(r.dateTime.getTime() - slot.getTime()) < SLOT_DURATION_MS);
        slots.push({ time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, available });
      }
    }
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

const resolveTable = async (tableInput: unknown) => {
  if (!tableInput) {
    return null;
  }

  const input = tableInput.toString().trim();

  if (mongoose.isValidObjectId(input)) {
    return Table.findById(input);
  }

  const directNumber = Number(input);
  if (!Number.isNaN(directNumber)) {
    return Table.findOne({ tableNumber: directNumber });
  }

  const digitsMatch = input.match(/\d+/);
  if (digitsMatch) {
    return Table.findOne({ tableNumber: Number(digitsMatch[0]) });
  }

  return null;
};

export const createReservation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body || {};
    const {
      tableId,
      customerDetails,
      dateTime,
      date,
      time,
      partySize,
      notes,
      name,
      fullName,
      email,
      phone,
      status,
      depositAmount,
      paymentId,
    } = body;

    const normalizedCustomerDetails = {
      fullName: (customerDetails?.fullName || fullName || name || 'Guest').toString(),
      email: (customerDetails?.email || email || '').toString(),
      phone: (customerDetails?.phone || phone || '').toString(),
    };

    const normalizedDateTime = dateTime
      ? new Date(dateTime)
      : date && time
        ? new Date(`${date}T${time}`)
        : new Date();

    const table = await resolveTable(tableId);

    if (!table) {
      res.status(400).json({ error: 'A valid tableId or table number is required.' });
      return;
    }

    if (Number(partySize ?? 1) > table.capacity) {
      res.status(400).json({ error: `Table ${table.tableNumber} seats at most ${table.capacity} guests.` });
      return;
    }

    if (Number.isNaN(normalizedDateTime.getTime()) || normalizedDateTime.getTime() < Date.now()) {
      res.status(400).json({ error: 'Reservation date and time must be in the future.' });
      return;
    }

    if (await overlapsExistingReservation(table._id, normalizedDateTime)) {
      res.status(409).json({ error: 'This table is already reserved near that time. Please choose another slot.' });
      return;
    }

    const reservation = await Reservation.create({
      tableId: table._id,
      customerDetails: normalizedCustomerDetails,
      dateTime: normalizedDateTime,
      partySize: Number(partySize ?? 1),
      notes: notes || '',
      status: status || 'Pending',
      depositAmount: Number(depositAmount || 0),
      paymentId,
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
