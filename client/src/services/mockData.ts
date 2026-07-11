import type {
  Category,
  MenuItem,
  TableEntity,
  QRCodeRecord,
  Employee,
  NotificationRecord,
  DashboardStats,
  FloorStats,
  ReservationRecord,
  Ingredient,
} from '../types'

export const categories: Category[] = [
  {
    _id: 'cat-terra',
    index: '01',
    name: 'The Earth',
    latin: 'Terra',
    quote: '"Roots, ash, and the patience of soil."',
    servedNote: 'Served at cellar temperature — 12°C',
  },
  {
    _id: 'cat-mare',
    index: '02',
    name: 'The Sea',
    latin: 'Mare',
    quote: '"Brine, tide, and what the coals give back."',
    servedNote: 'Served chilled — 4°C',
  },
  {
    _id: 'cat-ignis',
    index: '03',
    name: 'The Fire',
    latin: 'Ignis',
    quote: '"Nothing arrives without first being tested by flame."',
    servedNote: 'Served straight from the hearth',
  },
]

export const menuItems: MenuItem[] = [
  {
    _id: 'item-01',
    categoryId: 'cat-terra',
    course: 1,
    no: '01',
    name: 'Smoked Beetroot & Ash',
    tagline: 'Buried. Burned. Unearthed.',
    price: 24,
    description:
      'Heirloom beetroot buried in birch ash for 36 hours, then split open at the table over a bed of black garlic soil.',
    composition: ['Chioggia beetroot', 'black garlic', 'aged sherry'],
    pairing: '2019 Movia Rebula, Slovenia',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=1200&auto=format&fit=crop',
    isBestSeller: true,
    soldCount: 412,
    prepTimeMinutes: 18,
    recipe: [
      { ingredientId: 'ing-01', quantityRequired: 2 },
      { ingredientId: 'ing-02', quantityRequired: 50 },
    ],
  },
  {
    _id: 'item-02',
    categoryId: 'cat-terra',
    course: 2,
    no: '02',
    name: 'Wild Mushroom Decay',
    tagline: 'Grown in the dark, served in it too.',
    price: 28,
    description:
      'A slow-fermented broth of forest mushrooms poured tableside over charred king oyster and pine oil.',
    composition: ['king oyster mushroom', 'forest broth', 'pine oil'],
    pairing: '2020 Jura Vin Jaune, France',
    image: 'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?q=80&w=1200&auto=format&fit=crop',
    isSeasonal: true,
    soldCount: 201,
    prepTimeMinutes: 22,
    recipe: [{ ingredientId: 'ing-03', quantityRequired: 3 }],
  },
  {
    _id: 'item-03',
    categoryId: 'cat-terra',
    course: 3,
    no: '03',
    name: 'Fermented Rye Root',
    tagline: 'Three weeks underground, one bite at the table.',
    price: 19,
    description: 'Rye bread root fermented with whey, brushed with brown butter and burnt honey.',
    composition: ['rye root', 'cultured whey', 'burnt honey'],
    pairing: 'Smoked barley tea',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop',
    soldCount: 156,
    prepTimeMinutes: 15,
    recipe: [{ ingredientId: 'ing-10', quantityRequired: 1 }],
  },
  {
    _id: 'item-04',
    categoryId: 'cat-mare',
    course: 1,
    no: '01',
    name: 'Charred Octopus, Ember Oil',
    tagline: 'Kissed by coal, cooled by brine.',
    price: 32,
    description:
      'Slow-braised octopus finished over live coals, dressed in an ember-infused oil with pickled shallot ash.',
    composition: ['Galician octopus', 'ember oil', 'pickled shallot'],
    pairing: '2021 Assyrtiko, Santorini',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
    isBestSeller: true,
    soldCount: 389,
    prepTimeMinutes: 25,
    recipe: [{ ingredientId: 'ing-04', quantityRequired: 2 }],
  },
  {
    _id: 'item-05',
    categoryId: 'cat-mare',
    course: 2,
    no: '02',
    name: 'Scallop, Burnt Citrus',
    tagline: 'Seared thirty seconds. Remembered longer.',
    price: 29,
    description: 'Diver scallop seared in brown butter, finished with a scorched yuzu glaze and sea fennel.',
    composition: ['diver scallop', 'scorched yuzu', 'sea fennel'],
    pairing: 'Manzanilla sherry, Spain',
    image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?q=80&w=1200&auto=format&fit=crop',
    soldCount: 178,
    prepTimeMinutes: 14,
    recipe: [{ ingredientId: 'ing-05', quantityRequired: 4 }],
  },
  {
    _id: 'item-06',
    categoryId: 'cat-mare',
    course: 3,
    no: '03',
    name: 'Salt-Crust Turbot',
    tagline: 'Cracked open at the table.',
    price: 36,
    description: 'Whole turbot baked in a rock-salt crust, cracked tableside and finished with brown-butter capers.',
    composition: ['wild turbot', 'rock salt crust', 'brown butter capers'],
    pairing: '2018 Chablis Premier Cru',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=1200&auto=format&fit=crop',
    isSeasonal: true,
    soldCount: 134,
    prepTimeMinutes: 35,
    recipe: [{ ingredientId: 'ing-06', quantityRequired: 1 }],
  },
  {
    _id: 'item-07',
    categoryId: 'cat-ignis',
    course: 1,
    no: '01',
    name: 'Dry-Aged Rib, Live Coal',
    tagline: 'Forty days aged. Three minutes negotiated with fire.',
    price: 48,
    description: '40-day dry-aged rib cooked directly on live coals, rested on smoked bone marrow butter.',
    composition: ['dry-aged rib', 'bone marrow butter', 'charred herb oil'],
    pairing: '2017 Barolo, Piedmont',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=1200&auto=format&fit=crop',
    isBestSeller: true,
    soldCount: 467,
    prepTimeMinutes: 28,
    recipe: [{ ingredientId: 'ing-07', quantityRequired: 1 }],
  },
  {
    _id: 'item-08',
    categoryId: 'cat-ignis',
    course: 2,
    no: '02',
    name: 'Ash-Roasted Squab',
    tagline: 'Buried in embers, lacquered in smoke.',
    price: 34,
    description: 'Whole squab roasted under hot ash, lacquered with a reduction of blackened fig and juniper.',
    composition: ['whole squab', 'blackened fig', 'juniper reduction'],
    pairing: '2019 Syrah, Northern Rhône',
    image: 'https://images.unsplash.com/photo-1432139509613-5c4255815697?q=80&w=1200&auto=format&fit=crop',
    soldCount: 142,
    prepTimeMinutes: 30,
    recipe: [{ ingredientId: 'ing-08', quantityRequired: 1 }],
  },
  {
    _id: 'item-09',
    categoryId: 'cat-ignis',
    course: 3,
    no: '03',
    name: 'Charcoal Sourdough, Cultured Butter',
    tagline: 'The last thing to touch the fire.',
    price: 14,
    description: 'Activated-charcoal sourdough baked in the hearth, served with smoked cultured butter and flaked salt.',
    composition: ['charcoal sourdough', 'cultured butter', 'smoked salt'],
    pairing: 'Espresso-black tea',
    image: 'https://images.unsplash.com/photo-1585478259715-4d3a5f4a0c31?q=80&w=1200&auto=format&fit=crop',
    soldCount: 298,
    prepTimeMinutes: 12,
    recipe: [{ ingredientId: 'ing-09', quantityRequired: 1 }],
  },
]

export const featured = {
  headline: 'Flames',
  headlineAccent: 'Charcoal.',
  intro:
    'A raw exploration of elemental cooking. We celebrate the intersection of smoke, salt, and darkness in every curated bite.',
  badge: { label: 'Michelin Rated', year: '2024' },
  image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1400&auto=format&fit=crop',
  location: { line1: '112 Industrial Way', line2: 'District Noir, NY' },
  hours: { line1: 'Tue — Sat', line2: '18:00 — 23:00' },
}

export const ingredients: Ingredient[] = [
  { _id: 'ing-01', name: 'Chioggia Beetroot', unit: 'pcs', quantityInStock: 40, lowStockThreshold: 10 },
  { _id: 'ing-02', name: 'Black Garlic', unit: 'g', quantityInStock: 500, lowStockThreshold: 100 },
  { _id: 'ing-03', name: 'King Oyster Mushroom', unit: 'pcs', quantityInStock: 30, lowStockThreshold: 8 },
  { _id: 'ing-04', name: 'Octopus Tentacle', unit: 'pcs', quantityInStock: 12, lowStockThreshold: 6 },
  { _id: 'ing-05', name: 'Diver Scallop', unit: 'pcs', quantityInStock: 3, lowStockThreshold: 5 },
  { _id: 'ing-06', name: 'Whole Turbot', unit: 'pcs', quantityInStock: 6, lowStockThreshold: 3 },
  { _id: 'ing-07', name: 'Dry-Aged Rib', unit: 'pcs', quantityInStock: 10, lowStockThreshold: 4 },
  { _id: 'ing-08', name: 'Squab', unit: 'pcs', quantityInStock: 8, lowStockThreshold: 4 },
  { _id: 'ing-09', name: 'Sourdough Loaf', unit: 'pcs', quantityInStock: 20, lowStockThreshold: 5 },
  { _id: 'ing-10', name: 'Rye Root', unit: 'pcs', quantityInStock: 2, lowStockThreshold: 5 },
]

export const tables: TableEntity[] = [
  {
    _id: 'table-01', tableNumber: 1, zone: 'Hearth', capacity: 2, status: 'serving',
    currentOrder: { party: 2, course: 2, courseName: 'Sea', seatedAt: '19:05', prepProgress: 100, serveProgress: 70, serveEta: '~4 min left', note: 'Anniversary — pacing slow.' },
  },
  {
    _id: 'table-02', tableNumber: 2, zone: 'Hearth', capacity: 4, status: 'in_the_pass',
    currentOrder: { party: 3, course: 3, courseName: 'Fire', seatedAt: '19:20', prepProgress: 65, prepEta: '~7 min left', serveProgress: 100 },
  },
  { _id: 'table-03', tableNumber: 3, zone: 'Hearth', capacity: 2, status: 'available' },
  {
    _id: 'table-04', tableNumber: 4, zone: 'Cellar', capacity: 6, status: 'seated',
    currentOrder: { party: 5, course: 1, courseName: 'Earth', seatedAt: '19:40', prepProgress: 35, prepEta: '~11 min left', serveProgress: 100, note: 'One pescatarian.' },
  },
  { _id: 'table-05', tableNumber: 5, zone: 'Cellar', capacity: 4, status: 'resetting' },
  {
    _id: 'table-06', tableNumber: 6, zone: 'Cellar', capacity: 2, status: 'serving',
    currentOrder: { party: 2, course: 3, courseName: 'Fire', seatedAt: '18:50', prepProgress: 100, serveProgress: 88, serveEta: '~2 min left' },
  },
  {
    _id: 'table-07', tableNumber: 7, zone: 'Forge', capacity: 8, status: 'in_the_pass',
    currentOrder: { party: 7, course: 2, courseName: 'Sea', seatedAt: '19:15', prepProgress: 75, prepEta: '~5 min left', serveProgress: 100, note: "Chef's table — 9-course." },
  },
  { _id: 'table-08', tableNumber: 8, zone: 'Forge', capacity: 2, status: 'available' },
  {
    _id: 'table-09', tableNumber: 9, zone: 'Forge', capacity: 4, status: 'seated',
    currentOrder: { party: 4, course: 1, courseName: 'Earth', seatedAt: '19:45', prepProgress: 15, prepEta: '~15 min left', serveProgress: 100 },
  },
]

export const floorStats: FloorStats = {
  tables: 9,
  coversSeated: 23,
  available: 2,
  seated: 2,
  inThePass: 2,
  serving: 2,
}

export const qrCodes: QRCodeRecord[] = tables.map((t) => ({
  _id: `qr-${t._id}`,
  tableId: t._id,
  tableNumber: t.tableNumber,
  qrToken: `TOK-${t.tableNumber}-${Math.random().toString(36).slice(2, 8)}`,
  url: `https://noirandsel.example/order?table=${t.tableNumber}`,
  createdAt: '2026-01-04T10:00:00Z',
}))

export const employees: Employee[] = [
  { _id: 'emp-01', name: 'Marcus Thorne', email: 'marcus@noirsel.com', phone: '+1 212-555-0142', role: 'admin', position: 'Executive Chef', salary: 145000, hiredAt: '2021-03-01', status: 'active' },
  { _id: 'emp-02', name: 'Elena Vance', email: 'elena@noirsel.com', phone: '+1 212-555-0198', role: 'staff', position: 'Sommelier', salary: 78000, hiredAt: '2022-06-15', status: 'active' },
  { _id: 'emp-03', name: 'Devon Ruiz', email: 'devon@noirsel.com', phone: '+1 212-555-0173', role: 'staff', position: 'Server', salary: 52000, hiredAt: '2023-01-10', status: 'active' },
  { _id: 'emp-04', name: 'Priya Nandan', email: 'priya@noirsel.com', phone: '+1 212-555-0111', role: 'staff', position: 'Host', salary: 48000, hiredAt: '2023-09-20', status: 'active' },
  { _id: 'emp-05', name: 'Sam Okafor', email: 'sam@noirsel.com', phone: '+1 212-555-0129', role: 'staff', position: 'Line Cook', salary: 56000, hiredAt: '2022-11-02', status: 'suspended' },
]

export const notifications: NotificationRecord[] = [
  { _id: 'notif-01', userId: 'emp-02', type: 'reservation', message: 'New reservation request — Table 4, party of 5, tonight 19:40.', isRead: false, createdAt: '2026-07-08T17:32:00Z' },
  { _id: 'notif-02', userId: 'emp-02', type: 'order', message: "Table 7 order ready at the pass — Chef's table, course 2.", isRead: false, createdAt: '2026-07-08T17:20:00Z' },
  { _id: 'notif-03', userId: 'emp-02', type: 'inventory', message: 'Diver scallops running low — 6 portions left.', isRead: true, createdAt: '2026-07-08T15:05:00Z' },
  { _id: 'notif-04', userId: 'emp-01', type: 'system', message: 'Payment succeeded for reservation deposit — Table 2.', isRead: false, createdAt: '2026-07-08T16:48:00Z' },
]

export const dashboardStats: DashboardStats = {
  revenueToday: 8420,
  revenueThisMonth: 184300,
  ordersToday: 61,
  avgOrderValue: 138,
  topCustomers: [
    { customerId: 'cust-01', name: 'Isabelle Cho', email: 'isabelle.cho@example.com', totalSpent: 4820, visits: 14 },
    { customerId: 'cust-02', name: 'Julian Marsh', email: 'julian.marsh@example.com', totalSpent: 3990, visits: 11 },
    { customerId: 'cust-03', name: 'Priya Anand', email: 'priya.anand@example.com', totalSpent: 3410, visits: 9 },
    { customerId: 'cust-04', name: 'Tomás Rivera', email: 'tomas.rivera@example.com', totalSpent: 2985, visits: 8 },
    { customerId: 'cust-05', name: 'Naomi Fischer', email: 'naomi.fischer@example.com', totalSpent: 2760, visits: 7 },
  ],
  bestSellers: menuItems
    .filter((m) => m.soldCount)
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 5)
    .map((m) => ({ menuItemId: m._id, name: m.name, unitsSold: m.soldCount || 0, revenue: (m.soldCount || 0) * m.price })),
  revenueByDay: [
    { day: 'Mon', revenue: 6200 },
    { day: 'Tue', revenue: 7150 },
    { day: 'Wed', revenue: 6800 },
    { day: 'Thu', revenue: 8420 },
    { day: 'Fri', revenue: 11200 },
    { day: 'Sat', revenue: 12980 },
    { day: 'Sun', revenue: 9340 },
  ],
}

export const reservations: ReservationRecord[] = [
  {
    _id: 'res-01', tableId: 'table-04', name: 'Isabelle Cho', email: 'isabelle.cho@example.com', phone: '+1 646-555-0110',
    date: '2026-07-08', time: '19:40', partySize: 5, notes: 'One pescatarian.', status: 'seated', depositAmount: 25,
    paymentId: 'pay-01', createdAt: '2026-07-05T12:00:00Z',
  },
]
