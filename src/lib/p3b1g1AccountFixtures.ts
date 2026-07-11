import { PRODUCTS, type CartItem, type Order, type ShippingInfo } from "@/app/store/storeData";
import type { Pet, Profile } from "@/app/profile/ProfileWorkspaceView";

export function loadP3B1g1AccountFixtures() {
if (process.env.NODE_ENV === "production") {
  throw new Error("Account fixtures are unavailable in production.");
}

const shipping: ShippingInfo = {
  fullName: "Alex Morgan",
  email: "alex.fixture@example.com",
  address: "18 Pet Street",
  city: "Ghent",
  zipCode: "9000",
  country: "Belgium",
  phone: "+32 470 12 34 56",
};

const cart: CartItem[] = [
  { product: PRODUCTS[0], quantity: 1 },
  { product: PRODUCTS[3], quantity: 2 },
];

const profile: Profile = {
  id: "p3b1g1-fixture-owner",
  username: "alex_and_luna",
  display_name: "Alex Morgan",
  avatar_url: null,
  bio: "Pet parent, weekend walker, and PawPal community member.",
  language_pref: "en",
  location_city: "Ghent",
  trust_level: 3,
  paw_points: 480,
  is_verified: true,
  created_at: "2024-03-15T10:00:00.000Z",
};

const pets: Pet[] = [
  {
    id: "p3b1g1-fixture-pet-luna",
    name: "Luna",
    species_group: "canine",
    breed: "Golden Retriever",
    birth_date: "2021-04-12",
    avatar_url: null,
    social_traits: {
      social_tags: ["Friendly", "Good with Kids"],
      health_badges: ["Fully Vaccinated"],
      quirk: "Carries one favourite tennis ball everywhere.",
    },
    blood_type: "DEA 1.1+",
    owner_contact: "+32 470 12 34 56",
    nfc_tag_uid: "P3B1G1-NFC-LUNA",
    created_at: "2024-03-16T10:00:00.000Z",
  },
  {
    id: "p3b1g1-fixture-pet-milo",
    name: "Milo",
    species_group: "feline",
    breed: "European Shorthair",
    birth_date: "2022-09-03",
    avatar_url: null,
    social_traits: { social_tags: ["Cuddly"] },
    blood_type: "Type A",
    owner_contact: null,
    nfc_tag_uid: null,
    created_at: "2024-03-17T10:00:00.000Z",
  },
];

const subtotal = cart.reduce(
  (sum, item) => sum + item.product.price * item.quantity,
  0,
);

const orders: Order[] = [
  {
    id: "PP-FIXTURE-240711",
    items: cart,
    shipping,
    payment: { last4: "4242", brand: "Visa" },
    subtotal,
    shippingCost: 0,
    tax: subtotal * 0.21,
    total: subtotal * 1.21,
    status: "shipped",
    createdAt: "2026-07-09T14:30:00.000Z",
  },
];

const successSession = {
  id: "cs_p3b1g1_fixture_confirmed",
  mode: "payment",
  status: "complete",
  customer_email: shipping.email,
  amount_total: Math.round(subtotal * 100),
  currency: "eur",
  metadata: {
    shipping_name: shipping.fullName,
    shipping_address: shipping.address,
    shipping_city: shipping.city,
    shipping_zip: shipping.zipCode,
    shipping_country: shipping.country,
    shipping_phone: shipping.phone,
  },
  line_items: cart.map((item) => ({
    name: item.product.name,
    quantity: item.quantity,
    amount: Math.round(item.product.price * item.quantity * 100),
  })),
};

  return {
    profile: { profile, pets },
    checkout: { cart, shipping },
    orders,
    success: {
      orderId: "PP-FIXTURE-240711",
      session: successSession,
    },
  };
}
