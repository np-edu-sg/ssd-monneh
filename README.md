# Monneh

* Money tracker for everyone

Access the hosted version at [https://monneh.vercel.app](https://monneh.vercel.app)!

This project uses the Remix framework, please see the documentation below on how to understand the code.

* [Remix Docs](https://remix.run/docs)

## Quick start

To run Monneh on your local machine, you must have the following installed:

* NodeJS v16 and above
* PNPM
* MySQL

After you've finished installing, you need to configure Monneh with some basic required environment variables.

An example file is provided in `.example.env`. Copy this file and rename it to `.env`, replace the variables with
appropriate values.

You will need to create the required tables in your MySQL database in order to run Monneh. In your terminal of choice,
run:

```shell
cd /path/to/monneh
prisma db push
```

After you have successfully created the tables, you can start Monneh by running:

```shell
pnpm dev
```

### Common errors

`prisma db push` does not work because `prisma` cannot be found.

You can try running Prisma with `pnpx` instead:

```shell
pnpx prisma generate
```

## Deployment

After having run the `create-remix` command and selected "Vercel" as a deployment target, you only need
to [import your Git repository](https://vercel.com/new) into Vercel, and it will be deployed.

If you'd like to avoid using a Git repository, you can also deploy the directory by
running [Vercel CLI](https://vercel.com/cli):

```sh
npm i -g vercel
vercel
```

It is generally recommended to use a Git repository, because future commits will then automatically be deployed by
Vercel, through its [Git Integration](https://vercel.com/docs/concepts/git).

## Development

To run your Remix app locally, make sure your project's local dependencies are installed:

```sh
npm install
```

Afterwards, start the Remix development server like so:

```sh
npm run dev
```

Open up [http://localhost:3000](http://localhost:3000) and you should be ready to go!

If you're used to using the `vercel dev` command provided by [Vercel CLI](https://vercel.com/cli) instead, you can also
use that, but it's not needed.

## Transaction

* All transactions must be approved by a reviewer

## Access management

This is a multi-tenant application, where each tenant is an organization. A user can belong to in multiple
organizations. Each organization has a predefined set of roles:

| Role     | Permissions                              |
|----------|------------------------------------------|
| Owner    | Everything                               | 
| Reviewer | Ability to approve transactions          | 
| Member   | Ability to submit transaction for review |
