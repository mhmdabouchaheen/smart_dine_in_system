# API Documentation

Base URL: http://localhost:5000/api

## Menu

### GET /menu/categories
- Get all menu categories

### POST /menu/categories
- Create a new menu category

### POST /menu/items
- Create a new menu item

Example:
```bash
curl -X POST http://localhost:5000/api/menu/items \
  -H "Content-Type: application/json" \
  -d '{"categoryId":"6a4e14fe526c11869a116e4e","name":"Test Item","description":"Test","price":10,"isAvailable":true,"preparationTime":12,"recipe":[]}'
```

### PUT /menu/items/:id
- Update an existing menu item by ID

### GET /menu/items/category/:categoryId
- Get menu items for a specific category

## Orders

### POST /orders
- Create a new order

### GET /orders/active
- Get all active orders

### PATCH /orders/:id/status
- Update the status of an order

## Reservations

### POST /reservations
- Create a new reservation

Example:
```bash
curl -X POST http://localhost:5000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"tableId":"6a4e18930c84aa565d6ed24e","customerDetails":{"fullName":"Test User","email":"test@example.com","phone":"1234567890"},"dateTime":"2026-07-12T19:00:00.000Z","partySize":2,"notes":"Test"}'
```

### GET /reservations
- Get all reservations

## Tables

### GET /tables/:id/qrcode
- Generate a QR code for a table

## Users

### POST /users/register
- Register a new user

## Seed

### GET /seed
- Seed demo data into the backend
