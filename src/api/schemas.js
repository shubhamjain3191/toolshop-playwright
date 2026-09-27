const { z } = require('zod');

/**
 * Response schemas for the Tool Shop API.
 *
 * These are the contract half of the suite. Asserting on a couple of fields is
 * enough to prove an endpoint works; validating the whole shape is what catches
 * the change nobody told you about - a renamed field, a price arriving as a
 * string, a nullable that started coming back null.
 *
 * `.strict()` is used on the small objects on purpose: an unexpected extra key
 * is exactly the kind of accidental data exposure we want to hear about.
 */

const brandSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  })
  .strict();

/**
 * The brand nested inside a product is a trimmed-down version of the one
 * /brands returns - no slug. Worth modelling separately rather than making slug
 * optional everywhere, otherwise the standalone endpoint could quietly drop it
 * and nothing would fail.
 */
const embeddedBrandSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .strict();

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  parent_id: z.string().nullable().optional(),
});

const categoryTreeSchema = categorySchema.extend({
  sub_categories: z.array(categorySchema).optional(),
});

const productImageSchema = z.object({
  id: z.string(),
  by_name: z.string(),
  by_url: z.string().url(),
  source_name: z.string(),
  source_url: z.string().url(),
  file_name: z.string(),
  title: z.string(),
});

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  is_location_offer: z.boolean(),
  is_rental: z.boolean(),
  in_stock: z.boolean(),
  product_image: productImageSchema,
  category: categorySchema,
  brand: embeddedBrandSchema,
});

/** Laravel's standard paginator envelope. */
const paginatedSchema = (itemSchema) =>
  z.object({
    current_page: z.number().int().positive(),
    data: z.array(itemSchema),
    from: z.number().int().nullable(),
    last_page: z.number().int(),
    per_page: z.number().int(),
    to: z.number().int().nullable(),
    total: z.number().int(),
  });

const addressSchema = z.object({
  street: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  postal_code: z.string().nullable(),
  house_number: z.string().nullable().optional(),
});

const userSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  dob: z.string().nullable(),
  address: addressSchema,
});

const tokenSchema = z
  .object({
    access_token: z.string().min(20),
    token_type: z.literal('bearer'),
    expires_in: z.number().int().positive(),
  })
  .strict();

module.exports = {
  brandSchema,
  embeddedBrandSchema,
  categorySchema,
  categoryTreeSchema,
  productSchema,
  paginatedSchema,
  userSchema,
  tokenSchema,
};
