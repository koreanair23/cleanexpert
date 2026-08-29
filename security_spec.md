# Firestore Security Specification

## Data Invariants
- `Product`: Required fields: `name` (string, size 1-200), `imageUrl` (string, size 1-2000), `category` (enum: sale, rental, premium), `createdAt` (timestamp).
- `admins`: Documents in this collection define who can manage the catalog. The document ID is the user UID.

## Access Patterns
- **Public**: Anyone can `list` and `get` products.
- **Admin**: Only verified admins can `create`, `update`, and `delete` products.

## The "Dirty Dozen" Payloads (Red Team Tests)
1. Unauthenticated Create: Trying to add a product without logging in. (Denied)
2. Non-Admin Create: Logged in user (non-admin) trying to add a product. (Denied)
3. Spoofed Owner: Trying to set an owner field (if any) to another user. (Denied)
4. Mutation of Immutable: Trying to change `createdAt`. (Denied)
5. State Poisoning: Injecting non-enum category. (Denied)
6. Massive ID: Using a 2KB string as a product ID. (Denied)
7. Shadow Field: Adding an `isAdmin: true` field to a product document. (Denied)
8. Unauthorized Update: Non-admin trying to update a product name. (Denied)
9. Unauthorized Delete: Non-admin trying to delete a product. (Denied)
10. Unverified Email: Admin email but `email_verified` is false. (Denied)
11. Resource Poisoning: 1MB string in product name. (Denied)
12. Orphaned Write: Creating a product without proper schema validation. (Denied)
