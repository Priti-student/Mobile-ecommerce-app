# ShopEase — Mobile Vendor Store

A single-vendor mobile e-commerce app (Amazon/Flipkart-style) built with React, Vite, Tailwind CSS, and Express.

## Contributors

Developed collaboratively by **Priti Ram** and **Mohit Ram**.

### Contributions

#### Priti Ram
- Frontend development
- Backend integration
- MongoDB database setup and configuration
- JWT authentication and authorization implementation

#### Mohit Ram
- UI design and improvements
- API development support
- Testing and bug fixing
- Debugging and application refinement

## Current scope

- Role-based login (Customer / Vendor)
- Customer registration (Create account)
- Vendor account pre-seeded in the database (no vendor sign-up UI)
- **Vendor dashboard** — add, list, and delete products with Cloudinary image uploads
- Public product catalog on the home page (no login required)

## Environment setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

Optional: `JWT_SECRET`,`VENDOR_EMAIL`, `VENDOR_PASSWORD`, `PORT`

## Getting started

```bash
npm install
npm run dev:all
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Vendor login

The vendor email and password are read from your `.env` file via `VENDOR_EMAIL` and `VENDOR_PASSWORD`.  
If these are not set in `.env`, defaults are used at runtime.

## Scripts

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Start Vite frontend only       |
| `npm run server`  | Start Express API only         |
| `npm run dev:all` | Start frontend + API together  |
| `npm run build`   | Production build               |
