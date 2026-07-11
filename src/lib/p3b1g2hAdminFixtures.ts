import type { Product } from "@/app/store/storeData";
import type {
  PendingReportView,
  ReportsPagePayload,
} from "@/app/admin/reports/types";

export type P3B1g2hParkRiskFixture = {
  id: string;
  place_id: string;
  place_name: string;
  place_address: string | null;
  latitude: number | null;
  longitude: number | null;
  risk_type:
    | "toxic_plants"
    | "wildlife"
    | "water_terrain"
    | "construction_closure"
    | "sanitation_pollution"
    | "other";
  severity: "info" | "caution" | "high";
  title: string;
  description: string;
  evidence_url: string | null;
  source_type: "community" | "official";
  official_source_name: string | null;
  official_source_url: string | null;
  status:
    | "pending_confirmation"
    | "ready_for_review"
    | "approved"
    | "rejected"
    | "archived";
  confirmation_count: number;
  reporter_id: string | null;
  reviewer_id: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  highlighted_at: string | null;
  created_at: string;
  updated_at: string;
};

function profile(
  id: string,
  displayName: string,
  username: string,
) {
  return {
    id,
    displayName,
    username,
    avatarUrl: null,
    bannedAt: null,
  };
}

export function loadP3B1g2hAdminFixtures(): {
  parkRisks: P3B1g2hParkRiskFixture[];
  products: Product[];
  reports: ReportsPagePayload;
} {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Admin fixtures are unavailable in production.");
  }

  const parkRisks: P3B1g2hParkRiskFixture[] = [
    {
      id: "fixture-risk-riverside",
      place_id: "fixture-place-riverside",
      place_name: "Riverside Dog Meadow",
      place_address: "Riverside Lane 18, 9000 Ghent",
      latitude: 51.0547,
      longitude: 3.7178,
      risk_type: "water_terrain",
      severity: "high",
      title: "Flooded path beside the dog meadow",
      description:
        "Recent rain has covered the lower path. The upper entrance remains accessible.",
      evidence_url: "https://example.com/riverside-path",
      source_type: "community",
      official_source_name: null,
      official_source_url: null,
      status: "ready_for_review",
      confirmation_count: 4,
      reporter_id: "fixture-user-mila",
      reviewer_id: null,
      review_note: null,
      reviewed_at: null,
      highlighted_at: null,
      created_at: "2026-07-10T08:15:00.000Z",
      updated_at: "2026-07-10T09:30:00.000Z",
    },
    {
      id: "fixture-risk-oak-grove",
      place_id: "fixture-place-oak-grove",
      place_name: "Oak Grove Park",
      place_address: "Oak Grove 7, 9000 Ghent",
      latitude: 51.0612,
      longitude: 3.7241,
      risk_type: "toxic_plants",
      severity: "caution",
      title: "Suspected foxglove near the east gate",
      description:
        "Two walkers reported flowering plants beside the path and requested verification.",
      evidence_url: null,
      source_type: "community",
      official_source_name: null,
      official_source_url: null,
      status: "pending_confirmation",
      confirmation_count: 2,
      reporter_id: "fixture-user-noor",
      reviewer_id: null,
      review_note: null,
      reviewed_at: null,
      highlighted_at: null,
      created_at: "2026-07-09T14:20:00.000Z",
      updated_at: "2026-07-10T07:05:00.000Z",
    },
    {
      id: "fixture-risk-bridge-works",
      place_id: "fixture-place-bridge-works",
      place_name: "Canal Walk Park",
      place_address: "Canal Walk 2, 9000 Ghent",
      latitude: 51.0484,
      longitude: 3.7313,
      risk_type: "construction_closure",
      severity: "info",
      title: "Footbridge closed for maintenance",
      description:
        "The city has posted a signed diversion while the footbridge is repaired.",
      evidence_url: "https://example.com/canal-works",
      source_type: "official",
      official_source_name: "City of Ghent",
      official_source_url: "https://example.com/city-notice",
      status: "approved",
      confirmation_count: 3,
      reporter_id: "fixture-admin",
      reviewer_id: "fixture-admin",
      review_note: "Official notice verified.",
      reviewed_at: "2026-07-08T12:00:00.000Z",
      highlighted_at: "2026-07-08T12:00:00.000Z",
      created_at: "2026-07-08T11:30:00.000Z",
      updated_at: "2026-07-08T12:00:00.000Z",
    },
  ];

  const products: Product[] = [
    {
      id: "fixture-smart-tag",
      slug: "smart-safety-tag",
      sku: "FIX-SMART-TAG",
      name: "Smart Safety Tag",
      description: "A durable NFC safety tag for everyday collars.",
      details: "Weather-resistant shell, silent profile, and reusable finder page.",
      price: 18.99,
      category: "accessories",
      image: "🏷️",
      rating: 4.8,
      reviewCount: 126,
      badge: "Best Seller",
      inStock: true,
      stockQuantity: 42,
      published: true,
      tags: ["nfc", "safety", "collar"],
    },
    {
      id: "fixture-travel-bowl",
      slug: "foldable-travel-bowl",
      sku: "FIX-TRAVEL-BOWL",
      name: "Foldable Travel Bowl",
      description: "A lightweight silicone bowl for walks and day trips.",
      details: "Food-safe silicone with a clip and a 600 ml capacity.",
      price: 12.5,
      originalPrice: 15,
      category: "accessories",
      image: "🥣",
      rating: 4.6,
      reviewCount: 84,
      badge: "Sale",
      inStock: true,
      stockQuantity: 18,
      published: false,
      tags: ["travel", "walk", "bowl"],
    },
  ];

  const reporter = profile("fixture-reporter", "Mila Jacobs", "mila_walks");
  const reportedUser = profile("fixture-reported", "Robin Vermeer", "robin_and_bowie");
  const anotherReporter = profile("fixture-reporter-2", "Noor Peeters", "noor_pets");

  const reports: PendingReportView[] = [
    {
      id: "fixture-report-post",
      reporterId: reporter.id,
      reportedUserId: reportedUser.id,
      targetType: "post",
      targetId: "fixture-post",
      reason: "The post includes repeated personal attacks.",
      createdAt: "2026-07-10T15:20:00.000Z",
      reporter,
      reportedUser,
      target: {
        type: "post",
        id: "fixture-post",
        bodyPreview: "A fixture post used to review the content-removal state.",
        imageUrl: null,
        author: reportedUser,
        createdAt: "2026-07-10T14:55:00.000Z",
        removedAt: null,
      },
    },
    {
      id: "fixture-report-comment",
      reporterId: anotherReporter.id,
      reportedUserId: reportedUser.id,
      targetType: "comment",
      targetId: "fixture-comment",
      reason: "The comment contains threatening language.",
      createdAt: "2026-07-10T13:10:00.000Z",
      reporter: anotherReporter,
      reportedUser,
      target: {
        type: "comment",
        id: "fixture-comment",
        bodyPreview: "A fixture comment used to verify moderation controls.",
        author: reportedUser,
        contentId: "fixture-parent-post",
        createdAt: "2026-07-10T12:45:00.000Z",
        removedAt: null,
      },
    },
    {
      id: "fixture-report-user",
      reporterId: reporter.id,
      reportedUserId: reportedUser.id,
      targetType: "user",
      targetId: reportedUser.id,
      reason: "The account repeatedly posts abusive replies.",
      createdAt: "2026-07-10T10:05:00.000Z",
      reporter,
      reportedUser,
      target: {
        type: "user",
        id: reportedUser.id,
        profile: reportedUser,
      },
    },
  ];

  return {
    parkRisks,
    products,
    reports: {
      reports,
      page: 1,
      pageSize: 20,
      total: reports.length,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    },
  };
}
