import { tool } from "ai";
import { z } from "zod";
import { sanityFetch } from "../../../studio-e_commerce-ai/lib/live.ts";
import { AI_SEARCH_PRODUCTS_QUERY } from "../../../studio-e_commerce-ai/queries/products.ts";
import { formatPrice } from "@/lib/utils";
import { getStockStatus, getStockMessage } from "@/lib/constants/stock";
import { MATERIAL_VALUES, COLOR_VALUES } from "@/lib/constants/filters";
import type { SearchProduct } from "@/lib/ai/types";

type AIProductResult = {
  _id: string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  price?: number | null;
  image?: { asset?: { _id?: string; url?: string | null } | null } | null;
  category?: {
    _id?: string;
    title?: string | null;
    slug?: string | null;
  } | null;
  material?: string | null;
  color?: string | null;
  dimensions?: string | null;
  stock?: number | null;
  featured?: boolean | null;
  assemblyRequired?: boolean | null;
};

const productSearchSchema = z.object({
  query: z
    .string()
    .optional()
    .default("")
    .describe(
      "Search term to find products by name, description, or category (e.g., 'oak table', 'leather sofa', 'dining')",
    ),
  category: z
    .string()
    .optional()
    .default("")
    .describe(
      "Filter by category slug (e.g., 'sofas', 'tables', 'chairs', 'storage')",
    ),
  material: z
    .enum(MATERIAL_VALUES)
    .optional()
    .describe("Filter by material type (omit to skip this filter)"),
  color: z
    .enum(COLOR_VALUES)
    .optional()
    .describe("Filter by color (omit to skip this filter)"),
  minPrice: z
    .number()
    .optional()
    .default(0)
    .describe("Minimum price in GBP (e.g., 100)"),
  maxPrice: z
    .number()
    .optional()
    .default(0)
    .describe("Maximum price in GBP (e.g., 500). Use 0 for no maximum."),
});

export const searchProductsTool = tool({
  description:
    "Search for products in the furniture store. Can search by name, description, or category, and filter by material, color, and price range. Returns product details including stock availability.",
  inputSchema: productSearchSchema,
  execute: async ({ query, category, material, color, minPrice, maxPrice }) => {
    try {
      const { data: products } = await sanityFetch({
        query: AI_SEARCH_PRODUCTS_QUERY,
        params: {
          searchQuery: query || "",
          categorySlug: category || "",
          material: material || "",
          color: color || "",
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 0,
        },
      });

      const productList = (products ?? []) as AIProductResult[];

      if (productList.length === 0) {
        return {
          found: false,
          message:
            "No products found matching your criteria. Try different search terms or filters.",
          products: [],
          filters: {
            query,
            category,
            material,
            color,
            minPrice,
            maxPrice,
          },
        };
      }

      const formattedProducts: SearchProduct[] = productList.map((product) => ({
        id: product._id,
        name: product.name ?? null,
        slug: product.slug ?? null,
        description: product.description ?? null,
        price: product.price ?? null,
        priceFormatted: product.price ? formatPrice(product.price) : null,
        category: product.category?.title ?? null,
        categorySlug: product.category?.slug ?? null,
        material: product.material ?? null,
        color: product.color ?? null,
        dimensions: product.dimensions ?? null,
        stockCount: product.stock ?? 0,
        stockStatus: getStockStatus(product.stock),
        stockMessage: getStockMessage(product.stock),
        featured: product.featured ?? false,
        assemblyRequired: product.assemblyRequired ?? false,
        imageUrl: product.image?.asset?.url ?? null,
        productUrl: product.slug ? `/products/${product.slug}` : null,
      }));

      return {
        found: true,
        message: `Found ${productList.length} product${productList.length === 1 ? "" : "s"} matching your search.`,
        totalResults: productList.length,
        products: formattedProducts,
        filters: {
          query: query || "",
          category: category || "",
          material: material || "",
          color: color || "",
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 0,
        },
      };
    } catch (error) {
      console.error("[SearchProducts] Error:", error);
      return {
        found: false,
        message: "An error occurred while searching for products.",
        products: [],
        error: error instanceof Error ? error.message : "Unknown error",
        filters: {
          query: query || "",
          category: category || "",
          material: material || "",
          color: color || "",
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 0,
        },
      };
    }
  },
});
