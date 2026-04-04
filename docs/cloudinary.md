# Cloudinary in Travelogue

This document explains how Cloudinary fits into Travelogue today, what is already working, and which workflow is recommended right now.

## Current Reality

Travelogue already supports Cloudinary image delivery on the frontend.

In practice, the simplest working setup today is:

- store images in Cloudinary
- copy the Cloudinary image URL
- paste that URL into `cover_image_url` in Directus

That is enough for posts to display correctly in the app.

## Recommended Workflow Today

For now, use Cloudinary as the image host and Directus as the content source of truth.

### For Post Covers

1. Upload the image to Cloudinary.
2. Copy the final Cloudinary delivery URL.
3. In Directus, open the post.
4. Paste the URL into `cover_image_url`.
5. Save.

This is currently the most reliable and lowest-friction workflow.

### Suggested Cloudinary Folders

Use the folders already created in Cloudinary:

- `travelogue/posts`
- `travelogue/trips`
- `travelogue/home/featured`

Example naming:

- `travelogue/posts/paris-eiffel-01`
- `travelogue/trips/japan-kyoto-02`
- `travelogue/home/featured/hero-bali`

## Why This Works Well

- the image binary lives in Cloudinary, not on your VPS
- Directus keeps the business content
- the frontend can still use optimized Cloudinary delivery
- the workflow is simple and easy to maintain

## `cover_image_url` vs `featured_image_id`

Travelogue currently contains two approaches for post images.

### `cover_image_url`

This is the legacy and simplest field.

- you paste a full image URL
- the frontend uses it directly
- this is the recommended path today

### `featured_image_id`

This is the newer relational approach.

- it links a post to an item in `media_assets`
- `media_assets` can store `public_id`, `delivery_url`, dimensions, alt text, caption, and folder
- this is more structured, but also more setup-heavy

At the moment, these two paths overlap a bit. If your goal is speed and reliability, prefer `cover_image_url`.

## `media_assets`

The repo now includes a `media_assets` collection and related DB fields.

The idea is:

- Cloudinary stores the actual file
- Directus stores metadata about that file
- posts, trips, and photos can reference a shared media asset

This is useful if you want:

- reusable assets
- centralized alt/caption management
- Cloudinary `public_id` tracking
- a cleaner media model long term

But it is optional for now.

## Frontend Behavior

The frontend can work with both:

- direct image URLs through `cover_image_url`
- related Cloudinary assets through `media_assets`

If a post has a valid `cover_image_url`, the app can render correctly without using `media_assets`.

Relevant code:

- frontend Directus mapping: [`artifacts/travel-blog/src/lib/directus.ts`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/travel-blog/src/lib/directus.ts)
- Cloudinary URL helpers: [`artifacts/travel-blog/src/lib/cloudinary.ts`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/travel-blog/src/lib/cloudinary.ts)

## Directus and Cloudinary Uploads

There is partial groundwork in the repo for direct Cloudinary uploads from Directus or the custom frontend admin.

However, the upload experience is not yet stable enough to be considered the primary workflow.

For that reason, the recommended production-safe path right now is still:

- upload manually to Cloudinary
- paste the resulting URL into Directus

## Environment Variables

### Frontend

In [`artifacts/travel-blog/.env.local`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/travel-blog/.env.local):

```sh
VITE_API_BASE_URL=http://localhost:8055
VITE_CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
```

### Directus

If you want to continue experimenting with signed upload flows, add these to [`artifacts/directus/.env`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/.env):

```sh
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
```

## Common Pitfalls

### Posts disappear after schema changes

Usually one of these:

- Directus schema was not applied
- public read permissions were lost
- the frontend asked for fields that do not exist yet

Check:

- [`docs/directus.md`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/docs/directus.md)

### `403` on `/items/posts`, `/items/trips`, `/items/photos`

This is a Directus permissions problem, not a Cloudinary problem.

Make sure the public role can read:

- `posts`
- `trips`
- `photos`
- `journeys`
- `countries`
- `media_assets` if you use the new media model

### Directus custom upload widgets fail

This usually means one of:

- Directus was not restarted after extension changes
- Cloudinary env vars are missing
- the extension was not loaded
- auth/session on the custom endpoint failed

## Practical Recommendation

Use this policy for now:

- primary workflow: Cloudinary URL in `cover_image_url`
- optional future workflow: `media_assets` for structured media

That keeps the stack clean without blocking content work.

## Future Cleanup Options

Later, Travelogue should likely choose one of these and simplify:

1. Keep only `cover_image_url`
2. Move fully to `media_assets`

If simplicity remains the priority, option 1 is totally valid.

If long-term CMS cleanliness becomes more important, option 2 is the better direction.
