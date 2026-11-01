# shoplab-cart-mfe

Cart remote: line items, quantity edits, coupon box and totals. React + Vite.

**Exposes** `./Cart`.
**Consumes** `host/ui` (`useAuth`, `authFetch`, `emitCartUpdated`), `@shoplab/ui-kit` (`Money`, `FormField`, `ApiError`, shared singleton).
**HTTP:** `GET /cart`, `PATCH` and `DELETE /cart/items/:productId`, `POST /cart/coupon`, and `GET /products/:id` for line names. Guests send the `x-cart-id` header.
**Browser state:** `localStorage.shoplab.cartId`, the guest cart id. This remote keeps it in sync with the server; the catalog remote also writes it and the host merges and clears it after login.
**Events:** emits `cart:updated` `{ count }` after every cart response.

```
npm install
npm test
npm run build     # emits dist/assets/remoteEntry.js
npm start         # build + serve on port 5002
```
