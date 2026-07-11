// Local seed data shaped like the future MongoDB documents.
// Field names deliberately mirror the planned Mongoose schemas
// (Menu Categories / Menu Items) so swapping the mock calls in
// api.js for real Axios calls later requires no component changes.

export const categories = [
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

export const menuItems = [
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
    image:
      'https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=1200&auto=format&fit=crop',
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
    image:
      'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?q=80&w=1200&auto=format&fit=crop',
  },
  {
    _id: 'item-03',
    categoryId: 'cat-terra',
    course: 3,
    no: '03',
    name: 'Fermented Rye Root',
    tagline: 'Three weeks underground, one bite at the table.',
    price: 19,
    description:
      'Rye bread root fermented with whey, brushed with brown butter and burnt honey.',
    composition: ['rye root', 'cultured whey', 'burnt honey'],
    pairing: 'Smoked barley tea',
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop',
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
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
  },
  {
    _id: 'item-05',
    categoryId: 'cat-mare',
    course: 2,
    no: '02',
    name: 'Scallop, Burnt Citrus',
    tagline: 'Seared thirty seconds. Remembered longer.',
    price: 29,
    description:
      'Diver scallop seared in brown butter, finished with a scorched yuzu glaze and sea fennel.',
    composition: ['diver scallop', 'scorched yuzu', 'sea fennel'],
    pairing: 'Manzanilla sherry, Spain',
    image:
      'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?q=80&w=1200&auto=format&fit=crop',
  },
  {
    _id: 'item-06',
    categoryId: 'cat-mare',
    course: 3,
    no: '03',
    name: 'Salt-Crust Turbot',
    tagline: 'Cracked open at the table.',
    price: 36,
    description:
      'Whole turbot baked in a rock-salt crust, cracked tableside and finished with brown-butter capers.',
    composition: ['wild turbot', 'rock salt crust', 'brown butter capers'],
    pairing: '2018 Chablis Premier Cru',
    image:
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=1200&auto=format&fit=crop',
  },
  {
    _id: 'item-07',
    categoryId: 'cat-ignis',
    course: 1,
    no: '01',
    name: 'Dry-Aged Rib, Live Coal',
    tagline: 'Forty days aged. Three minutes negotiated with fire.',
    price: 48,
    description:
      '40-day dry-aged rib cooked directly on live coals, rested on smoked bone marrow butter.',
    composition: ['dry-aged rib', 'bone marrow butter', 'charred herb oil'],
    pairing: '2017 Barolo, Piedmont',
    image:
      'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=1200&auto=format&fit=crop',
  },
  {
    _id: 'item-08',
    categoryId: 'cat-ignis',
    course: 2,
    no: '02',
    name: 'Ash-Roasted Squab',
    tagline: 'Buried in embers, lacquered in smoke.',
    price: 34,
    description:
      'Whole squab roasted under hot ash, lacquered with a reduction of blackened fig and juniper.',
    composition: ['whole squab', 'blackened fig', 'juniper reduction'],
    pairing: '2019 Syrah, Northern Rhône',
    image:
      'https://images.unsplash.com/photo-1432139509613-5c4255815697?q=80&w=1200&auto=format&fit=crop',
  },
  {
    _id: 'item-09',
    categoryId: 'cat-ignis',
    course: 3,
    no: '03',
    name: 'Charcoal Sourdough, Cultured Butter',
    tagline: 'The last thing to touch the fire.',
    price: 14,
    description:
      'Activated-charcoal sourdough baked in the hearth, served with smoked cultured butter and flaked salt.',
    composition: ['charcoal sourdough', 'cultured butter', 'smoked salt'],
    pairing: 'Espresso-black tea',
    image:
      'https://images.unsplash.com/photo-1585478259715-4d3a5f4a0c31?q=80&w=1200&auto=format&fit=crop',
  },
]

export const featured = {
  headline: 'Flames',
  headlineAccent: 'Charcoal.',
  intro:
    'A raw exploration of elemental cooking. We celebrate the intersection of smoke, salt, and darkness in every curated bite.',
  badge: { label: 'Michelin Rated', year: '2024' },
  image:
    'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1400&auto=format&fit=crop',
  location: { line1: '112 Industrial Way', line2: 'District Noir, NY' },
  hours: { line1: 'Tue — Sat', line2: '18:00 — 23:00' },
}

export const tables = [
  { _id: 'table-01', number: 1, seats: 2, qrCode: 'QR-T01' },
  { _id: 'table-02', number: 2, seats: 4, qrCode: 'QR-T02' },
  { _id: 'table-03', number: 3, seats: 6, qrCode: 'QR-T03' },
]
