# Monneh

Look at the [nuxt 3 documentation](https://v3.nuxtjs.org) to learn more.

## Setup

Make sure to install the dependencies:

```bash
# yarn
yarn install

# npm
npm install

# pnpm
pnpm install --shamefully-hoist
```

## Development Server

Start the development server on http://localhost:3000

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Checkout the [deployment documentation](https://v3.nuxtjs.org/guide/deploy/presets) for more information.

# Architecture

Authentication: JWT (`jose`) + cookies

Authorization: Casbin

Database: Prisma + PlanetscaleDB (MySQL)

## `.env`

You should have a `.env` file in the project directory. This file will contain configuration needed to run the server. 

`DATABASE_URL`: Connection string for database

`JWT_SECRET`: Secret key used for JWT

`JWT_ISSUER`: Issuer (`iss`) used for JWT

`JWT_EXPIRATION_TIME`: Duration tokens are valid for

`JWT_COOKIE_NAME`: Name of the cookie stored on browser

There are some sensible defaults in `.example.env`. Copy the file and rename it to `.env`. Please remember to update `DATABASE_URL` with your actual connection string.

## Setting up database

You should have access to the PlanetscaleDB organization. If you do not, you can also use any database supported by
Prisma.

If you're using PlanetscaleDB, you should work on a branch.

1. Obtain a Prisma connection string from the PlanetscaleDB console
2. Put the connection string into your `.env` file
3. Run `prisma generate` or `pnpx prisma generate` 

If you made changes to the schema, you can push it to a branch by running:

`prisma db push`

Then open a deploy request to merge it to `main`. 
