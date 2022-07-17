import type { Role } from '@prisma/client'

export function defaultRoles(organizationId: number): Omit<Role, 'id'>[] {
    return [
        {
            name: 'Owner',
            description:
                'The owner has the highest authority in the organization.',
            allowApproveTransactions: true,
            allowCreateTransactions: true,
            allowCreateWallets: true,
            allowUpdateWallets: true,
            allowDeleteWallets: true,
            allowUpdateOrganization: true,
            allowReadAuditLog: true,
            organizationId,
        },
        {
            name: 'Administrator',
            description:
                'The administrator is the same as an owner, except they cannot update organization details.',
            allowApproveTransactions: true,
            allowCreateTransactions: true,
            allowCreateWallets: true,
            allowUpdateWallets: true,
            allowDeleteWallets: true,
            allowUpdateOrganization: false,
            allowReadAuditLog: true,
            organizationId,
        },
        {
            name: 'Reviewer',
            description:
                'The reviewer has the ability to create transactions as well as approve them.',
            allowApproveTransactions: true,
            allowCreateTransactions: true,
            allowCreateWallets: false,
            allowUpdateWallets: false,
            allowDeleteWallets: false,
            allowUpdateOrganization: false,
            allowReadAuditLog: true,
            organizationId,
        },
        {
            name: 'Member',
            description: 'The member can only create transactions.',
            allowApproveTransactions: false,
            allowCreateTransactions: true,
            allowCreateWallets: false,
            allowUpdateWallets: false,
            allowDeleteWallets: false,
            allowUpdateOrganization: false,
            allowReadAuditLog: false,
            organizationId,
        },
    ]
}
