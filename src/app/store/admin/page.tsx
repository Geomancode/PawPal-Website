"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  PackagePlus,
  RefreshCw,
  Save,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { loadP3B1g2hAdminFixtures } from "@/lib/p3b1g2hAdminFixtures";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import type { MessageKey } from "@/i18n/messages/en";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  PageShell,
  StatusMessage,
} from "@/components/ui";
import ProductVisual from "../ProductVisual";
import {
  CATEGORIES,
  PRODUCT_SELECT,
  type Category,
  type Product,
  type ProductBadge,
  type ProductRow,
  checkStoreAdmin,
  productFromRow,
} from "../storeData";

type ProductForm = {
  id: string;
  sku: string;
  name: string;
  description: string;
  details: string;
  category: Exclude<Category, "all">;
  price: string;
  originalPrice: string;
  imageUrl: string;
  imageEmoji: string;
  rating: string;
  reviewCount: string;
  badge: "" | ProductBadge;
  stockQuantity: string;
  inStock: boolean;
  published: boolean;
  tags: string;
};

const initialForm: ProductForm = {
  id: "",
  sku: "",
  name: "",
  description: "",
  details: "",
  category: "accessories",
  price: "",
  originalPrice: "",
  imageUrl: "",
  imageEmoji: "📦",
  rating: "0",
  reviewCount: "0",
  badge: "",
  stockQuantity: "10",
  inStock: true,
  published: true,
  tags: "",
};

const ADMIN_FIXTURES_ENABLED =
  process.env.NEXT_PUBLIC_P3B1G2H_ADMIN_FIXTURES === "1";

const storeCategories = CATEGORIES.filter(
  (item): item is { key: Exclude<Category, "all">; label: string; icon: string } =>
    item.key !== "all",
);

const categoryLabelKeys: Record<Exclude<Category, "all">, MessageKey> = {
  food: "storeCategoryFood",
  toys: "storeCategoryToys",
  accessories: "storeCategoryAccessories",
  health: "storeCategoryHealth",
};

const categoryValueKeys: Record<Category, MessageKey> = {
  all: "storeAdminCategoryValueAll",
  food: "storeAdminCategoryValueFood",
  toys: "storeAdminCategoryValueToys",
  accessories: "storeAdminCategoryValueAccessories",
  health: "storeAdminCategoryValueHealth",
};

const badgeLabelKeys: Record<ProductBadge, MessageKey> = {
  New: "storeAdminBadgeNew",
  "Best Seller": "storeAdminBadgeBestSeller",
  Sale: "storeAdminBadgeSale",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function StoreAdminPage() {
  const router = useRouter();
  const { path } = useI18n();
  const { loader, t } = useRouteTranslations();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(ADMIN_FIXTURES_ENABLED);
  const [checkingAdmin, setCheckingAdmin] = useState(!ADMIN_FIXTURES_ENABLED);
  const [products, setProducts] = useState<Product[]>(() =>
    ADMIN_FIXTURES_ENABLED
      ? loadP3B1g2hAdminFixtures().products
      : [],
  );
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger" | "warning"; text: string } | null>(null);

  const previewProduct = useMemo<Product>(() => ({
    id: form.id || "preview",
    name: form.name || t("storeAdminNewProduct"),
    description: form.description,
    price: Number(form.price) || 0,
    originalPrice: numberOrNull(form.originalPrice) ?? undefined,
    category: form.category,
    image: form.imageEmoji || "📦",
    imageUrl: filePreview || form.imageUrl || undefined,
    rating: Number(form.rating) || 0,
    reviewCount: Number(form.reviewCount) || 0,
    badge: form.badge || undefined,
    inStock: form.inStock,
    published: form.published,
    tags: splitTags(form.tags),
  }), [filePreview, form, t]);

  const refreshProducts = useCallback(async () => {
    setLoadingProducts(true);
    if (ADMIN_FIXTURES_ENABLED) {
      setProducts(loadP3B1g2hAdminFixtures().products);
      setLoadingProducts(false);
      return;
    }
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage({
        tone: "warning",
        text: `${t("storeAdminCatalogUnavailablePrefix")} ${error.message}`,
      });
      setProducts([]);
    } else {
      setProducts((data ?? []).map((row) => productFromRow(row as unknown as ProductRow)));
    }
    setLoadingProducts(false);
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    if (ADMIN_FIXTURES_ENABLED) return;
    if (authLoading) return;
    if (!user) {
      setCheckingAdmin(false);
      setIsAdmin(false);
      return;
    }
    setCheckingAdmin(true);
    checkStoreAdmin().then((allowed) => {
      if (cancelled) return;
      setIsAdmin(allowed);
      setCheckingAdmin(false);
    });
    return () => { cancelled = true; };
  }, [authLoading, user]);

  useEffect(() => {
    if (isAdmin) void refreshProducts();
  }, [isAdmin, refreshProducts]);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function updateForm<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !current.id) {
        next.id = slugify(String(value));
      }
      if (key === "name" && !current.sku) {
        next.sku = slugify(String(value)).toUpperCase();
      }
      return next;
    });
  }

  function loadProduct(product: Product) {
    setForm({
      id: product.id,
      sku: product.sku || product.id.toUpperCase(),
      name: product.name,
      description: product.description,
      details: product.details || "",
      category: product.category === "all" ? "accessories" : product.category,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      imageUrl: product.imageUrl || "",
      imageEmoji: product.imageUrl ? "📦" : product.image,
      rating: String(product.rating),
      reviewCount: String(product.reviewCount),
      badge: product.badge || "",
      stockQuantity: String(product.stockQuantity ?? 0),
      inStock: product.inStock,
      published: product.published ?? true,
      tags: product.tags?.join(", ") || "",
    });
    setFile(null);
    setMessage(null);
  }

  async function uploadAsset(productId: string) {
    if (!file) return null;
    const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
    const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "asset";
    const storagePath = `products/${productId}/${Date.now()}-${baseName}.${extension}`;

    const { error } = await supabase.storage
      .from("product-assets")
      .upload(storagePath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("product-assets")
      .getPublicUrl(storagePath);

    return {
      storagePath,
      publicUrl: data.publicUrl,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ADMIN_FIXTURES_ENABLED) return;
    if (!user) return;

    const productId = slugify(form.id || form.name);
    if (!productId || !form.name.trim() || !form.price.trim()) {
      setMessage({ tone: "danger", text: t("storeAdminRequiredFieldsMessage") });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const uploaded = await uploadAsset(productId);
      const imageUrl = uploaded?.publicUrl || form.imageUrl.trim() || form.imageEmoji.trim() || "📦";
      const originalPrice = numberOrNull(form.originalPrice);

      const payload = {
        id: productId,
        slug: slugify(form.name),
        sku: form.sku.trim() || productId.toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim(),
        details: form.details.trim() || null,
        price: Number(form.price),
        original_price: originalPrice,
        currency: "EUR",
        category: form.category,
        image_url: imageUrl,
        rating: Number(form.rating) || 0,
        review_count: Number(form.reviewCount) || 0,
        badge: form.badge || null,
        in_stock: form.inStock,
        stock_quantity: Number(form.stockQuantity) || 0,
        published: form.published,
        tags: splitTags(form.tags),
        updated_by: user.id,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("products")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      if (uploaded) {
        const { error: assetError } = await supabase.from("product_assets").insert({
          product_id: productId,
          storage_path: uploaded.storagePath,
          public_url: uploaded.publicUrl,
          asset_type: file?.type.startsWith("video/") ? "video" : "image",
          alt_text: form.name.trim(),
          is_primary: true,
          sort_order: 0,
          created_by: user.id,
        });
        if (assetError) throw assetError;
      }

      setMessage({ tone: "success", text: t("storeAdminProductSavedMessage") });
      setForm(initialForm);
      setFile(null);
      await refreshProducts();
    } catch (error) {
      setMessage({
        tone: "danger",
        text: error instanceof Error ? error.message : t("storeAdminSaveFailedMessage"),
      });
    } finally {
      setSaving(false);
    }
  }

  if (!ADMIN_FIXTURES_ENABLED && (authLoading || checkingAdmin)) {
    return (
      <>
        {loader}
        <div className="flex min-h-screen items-center justify-center bg-paw-page pt-24 text-paw-ink">
          <Loader2 className="h-8 w-8 animate-spin text-paw-primary" aria-hidden="true" />
        </div>
      </>
    );
  }

  if (!ADMIN_FIXTURES_ENABLED && !user) {
    return (
      <>
        {loader}
        <PageShell
        className="admin-page-shell admin-gate-shell min-h-screen pt-28"
        headerClassName="admin-shell-header"
        eyebrow={t("storeAdminEyebrow")}
        title={t("storeAdminSignInRequired")}
        description={t("storeAdminSignInDescription")}
        actions={
          <Button type="button" onClick={() => router.push(path("/auth"))}>
            {t("storeAdminSignIn")}
          </Button>
        }
      >
        <Card className="admin-card-upgraded p-8">
          <EmptyState icon={ShieldCheck} title={t("storeAdminNoActiveSession")} description={t("storeAdminReturnAfterSignIn")} />
        </Card>
        </PageShell>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        {loader}
        <PageShell
        className="admin-page-shell admin-gate-shell min-h-screen pt-28"
        headerClassName="admin-shell-header"
        eyebrow={t("storeAdminEyebrow")}
        title={t("storeAdminAccessRestricted")}
        description={t("storeAdminAccessRestrictedDescription")}
        actions={
          <Button type="button" variant="secondary" onClick={() => router.push(path("/store"))}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("storeAdminBackToStore")}
          </Button>
        }
      >
        <Card className="admin-card-upgraded p-8">
          <EmptyState icon={ShieldCheck} title={t("storeAdminNotAdmin")} description={user?.email || t("storeAdminNotAuthorized")} />
        </Card>
        </PageShell>
      </>
    );
  }

  return (
    <>
      {loader}
      <PageShell
      className="admin-page-shell min-h-screen pt-28"
      headerClassName="admin-shell-header"
      eyebrow={t("storeAdminEyebrow")}
      title={t("storeAdminCatalogTitle")}
      description={t("storeAdminCatalogDescription")}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={() => router.push(path("/store"))}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("storeAdminStore")}
          </Button>
          <Button type="button" variant="trust" onClick={refreshProducts} disabled={loadingProducts}>
            <RefreshCw className={loadingProducts ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            {t("storeAdminRefresh")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card className="admin-card-upgraded">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-paw-primary" aria-hidden="true" />
                <h2 className="text-xl font-extrabold text-paw-ink">{t("storeAdminProductInformation")}</h2>
              </div>

              {message && (
                <StatusMessage tone={message.tone}>
                  {message.text}
                </StatusMessage>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label={t("storeAdminProductId")} value={form.id} onChange={(e) => updateForm("id", slugify(e.target.value))} placeholder={t("storeAdminProductIdPlaceholder")} required />
                <Input label={t("storeAdminSku")} value={form.sku} onChange={(e) => updateForm("sku", e.target.value.toUpperCase())} placeholder={t("storeAdminSkuPlaceholder")} required />
                <Input label={t("storeAdminName")} value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder={t("storeAdminNamePlaceholder")} required containerClassName="md:col-span-2" />
                <Input label={t("storeAdminShortDescription")} value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder={t("storeAdminShortDescriptionPlaceholder")} required containerClassName="md:col-span-2" />
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-bold text-paw-ink" htmlFor="details">{t("storeAdminDetails")}</label>
                  <textarea
                    id="details"
                    value={form.details}
                    onChange={(e) => updateForm("details", e.target.value)}
                    rows={4}
                    className="w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 py-3 text-sm text-paw-ink shadow-sm transition placeholder:text-paw-muted focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                    placeholder={t("storeAdminDetailsPlaceholder")}
                  />
                </div>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold text-paw-ink">{t("storeAdminCategory")}</span>
                  <select
                    value={form.category}
                    onChange={(e) => updateForm("category", e.target.value as ProductForm["category"])}
                    className="h-11 w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 text-sm font-bold text-paw-ink shadow-sm focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                  >
                    {storeCategories.map((category) => (
                      <option key={category.key} value={category.key}>{category.icon} {t(categoryLabelKeys[category.key])}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold text-paw-ink">{t("storeAdminBadge")}</span>
                  <select
                    value={form.badge}
                    onChange={(e) => updateForm("badge", e.target.value as ProductForm["badge"])}
                    className="h-11 w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 text-sm font-bold text-paw-ink shadow-sm focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                  >
                    <option value="">{t("storeAdminBadgeNone")}</option>
                    <option value="New">{t("storeAdminBadgeNew")}</option>
                    <option value="Best Seller">{t("storeAdminBadgeBestSeller")}</option>
                    <option value="Sale">{t("storeAdminBadgeSale")}</option>
                  </select>
                </label>
                <Input label={t("storeAdminPriceEur")} type="number" step="0.01" min="0" value={form.price} onChange={(e) => updateForm("price", e.target.value)} placeholder="12.99" required />
                <Input label={t("storeAdminOriginalPrice")} type="number" step="0.01" min="0" value={form.originalPrice} onChange={(e) => updateForm("originalPrice", e.target.value)} placeholder="19.99" />
                <Input label={t("storeAdminRating")} type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => updateForm("rating", e.target.value)} placeholder="0" />
                <Input label={t("storeAdminReviewCount")} type="number" min="0" value={form.reviewCount} onChange={(e) => updateForm("reviewCount", e.target.value)} placeholder="0" />
                <Input label={t("storeAdminStockQuantity")} type="number" min="0" value={form.stockQuantity} onChange={(e) => updateForm("stockQuantity", e.target.value)} placeholder="10" />
                <Input label={t("storeAdminTags")} value={form.tags} onChange={(e) => updateForm("tags", e.target.value)} placeholder={t("storeAdminTagsPlaceholder")} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-paw-md border border-paw-border bg-paw-panel-subtle px-4 py-3 text-sm font-bold text-paw-ink">
                  <input type="checkbox" checked={form.inStock} onChange={(e) => updateForm("inStock", e.target.checked)} className="h-4 w-4 accent-paw-primary" />
                  {t("storeAdminInStock")}
                </label>
                <label className="flex items-center gap-3 rounded-paw-md border border-paw-border bg-paw-panel-subtle px-4 py-3 text-sm font-bold text-paw-ink">
                  <input type="checkbox" checked={form.published} onChange={(e) => updateForm("published", e.target.checked)} className="h-4 w-4 accent-paw-primary" />
                  {t("storeAdminPublished")}
                </label>
              </div>

              <div className="admin-asset-panel space-y-4 rounded-paw-lg border border-paw-border bg-paw-panel-subtle p-4">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-paw-trust" aria-hidden="true" />
                  <h3 className="font-extrabold text-paw-ink">{t("storeAdminProductAsset")}</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label={t("storeAdminFallbackEmoji")} value={form.imageEmoji} onChange={(e) => updateForm("imageEmoji", e.target.value)} placeholder="📦" maxLength={4} />
                  <Input label={t("storeAdminExistingImageUrl")} value={form.imageUrl} onChange={(e) => updateForm("imageUrl", e.target.value)} placeholder="https://..." />
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-paw-md border border-dashed border-paw-border bg-paw-panel px-4 py-8 text-center transition hover:border-paw-trust hover:bg-paw-trust-soft/40">
                  <UploadCloud className="h-8 w-8 text-paw-trust" aria-hidden="true" />
                  <span className="text-sm font-extrabold text-paw-ink">
                    {file ? file.name : t("storeAdminUploadMainImage")}
                  </span>
                  <span className="text-xs font-semibold text-paw-muted">{t("storeAdminUploadFormats")}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <Button type="submit" size="lg" disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Save className="h-5 w-5" aria-hidden="true" />}
                {t("storeAdminSaveProduct")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="admin-preview-card">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-paw-ink">{t("storeAdminPreview")}</h2>
                {previewProduct.badge && <Badge tone="accent">{t(badgeLabelKeys[previewProduct.badge])}</Badge>}
              </div>
              <div className="admin-preview-media flex justify-center rounded-paw-md bg-paw-primary-soft p-6">
                <ProductVisual product={previewProduct} size="lg" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-paw-ink">{previewProduct.name}</p>
                <p className="mt-1 text-sm leading-6 text-paw-body">{previewProduct.description || t("storeAdminProductDescriptionPreview")}</p>
                <p className="mt-3 text-xl font-extrabold text-paw-primary">€{previewProduct.price.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-card-upgraded">
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-paw-ink">{t("storeAdminCatalog")}</h2>
                <Badge tone="trust">{products.length}</Badge>
              </div>
              {products.length === 0 ? (
                <EmptyState icon={PackagePlus} title={t("storeAdminNoProductsLoaded")} description={t("storeAdminNoProductsDescription")} />
              ) : (
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => loadProduct(product)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-3 text-left transition hover:border-paw-primary/40 hover:bg-paw-primary-soft"
                    >
                      <ProductVisual product={product} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-paw-ink">{product.name}</p>
                        <p className="text-xs font-semibold text-paw-muted">€{product.price.toFixed(2)} · {t(categoryValueKeys[product.category])}</p>
                      </div>
                      <Badge tone={product.published === false ? "warning" : "success"}>
                        {product.published === false ? t("storeAdminDraft") : t("storeAdminLive")}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </PageShell>
    </>
  );
}
