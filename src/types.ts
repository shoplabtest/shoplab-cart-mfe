/** Response shapes from shoplab-contracts openapi/cart-api.yaml and catalog-api.yaml. */
export interface CartLine {
  productId: string;
  quantity: number;
  /** Price snapshot in minor units, taken when the item was added. */
  unitPrice: number;
  /** Present when the catalog price changed after the snapshot. */
  latestUnitPrice?: number;
}

export interface Cart {
  id: string;
  lines: CartLine[];
  coupon: string | null;
  total: number;
  currency: string;
}

export interface ProductName { id: string; name: string }
