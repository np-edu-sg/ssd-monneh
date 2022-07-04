// import { defineEventHandler } from 'h3'
//
// export default defineEventHandler(async (event) => {
//   const { $casbin, $prisma } = useNuxtApp()
//
//   return await $prisma.$transaction(async (prisma) => {
//     const organization = prisma.organization.create({
//       data: {
//         name: 'ACME Organization',
//         wallets: {
//           create: [
//             {
//               name: 'International Cash Funds',
//               balance: 10028.93,
//             },
//           ],
//         },
//         users: {
//           connect: {
//
//           },
//         },
//       },
//     })
//
//     return organization
//   })
// })
