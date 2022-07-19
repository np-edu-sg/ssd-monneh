import { db } from '~/utils/db.server'
import { json } from '@remix-run/node'
import { Role } from '~/utils/roles'

interface RoleValue {
    name: string
    description: string
    allowApproveTransactions: boolean
    allowCreateTransactions: boolean
    allowCreateWallets: boolean
    allowUpdateWallets: boolean
    allowDeleteWallets: boolean
    allowUpdateOrganization: boolean
    allowReadAuditLog: boolean
}

export const defaultRoles: Record<Role, RoleValue> = {
    [Role.Owner]: {
        name: 'Owner',
        description: 'The owner has the highest authority in the organization.',
        allowApproveTransactions: true,
        allowCreateTransactions: true,
        allowCreateWallets: true,
        allowUpdateWallets: true,
        allowDeleteWallets: true,
        allowUpdateOrganization: true,
        allowReadAuditLog: true,
    },
    [Role.Administrator]: {
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
    },
    [Role.Reviewer]: {
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
    },
    [Role.Member]: {
        name: 'Member',
        description: 'The member can only create transactions.',
        allowApproveTransactions: false,
        allowCreateTransactions: true,
        allowCreateWallets: false,
        allowUpdateWallets: false,
        allowDeleteWallets: false,
        allowUpdateOrganization: false,
        allowReadAuditLog: false,
    },
}

export async function requireAuthorization(
    username: string,
    organizationId: number,
    selector: (role: RoleValue) => boolean
) {
    const result = await db.organizationToUser.findUnique({
        where: {
            organizationId_username: {
                username,
                organizationId,
            },
        },
    })
    if (!result) {
        throw json('Not found', { status: 404 })
    }

    if (!Object.values(Role).includes(result.role as Role)) {
        console.error(
            `An unrecognized role ${result.role} was used for username ${username} in organization with ID ${organizationId}`
        )
        throw json('Internal server error', { status: 500 })
    }

    const role = defaultRoles[result.role as Role]
    if (!role) {
        console.error(
            `An unrecognized role ${result.role} was used for username ${username} in organization with ID ${organizationId}`
        )
        throw json('Internal server error', { status: 500 })
    }

    if (!selector(role)) {
        throw json('Unauthorized', { status: 403 })
    }

    return result
}
