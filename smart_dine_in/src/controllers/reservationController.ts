import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Reservation } from '../models/Reservation';
import { Table } from '../models/Table';

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
      const reservation = await Reservation.create({
        tableId: tableId?.toString() || 'unknown',
        customerDetails: normalizedCustomerDetails,
        dateTime: normalizedDateTime,
        partySize: Number(partySize ?? 1),
        notes: notes || '',
        status: status || 'Pending',
      });

      res.status(201).json(reservation);
      return;
    }

    const reservation = await Reservation.create({
      tableId: table._id,
      customerDetails: normalizedCustomerDetails,
      dateTime: normalizedDateTime,
      partySize: Number(partySize ?? 1),
      notes: notes || '',
      status: status || 'Pending',
    });

    await Table.findByIdAndUpdate(table._id, {
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