import type { ThrownResponse } from '@remix-run/react'
import { useCatch, useLoaderData, useParams } from '@remix-run/react'
import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Center, Text } from '@mantine/core'
import type { Organization } from '@prisma/client'
import { db } from '~/utils/db.server'

interface LoaderData {
  organization: Organization
}

type OrganizationNotFoundError = ThrownResponse<404, string>
type OrganizationIDNotProvided = ThrownResponse<400, string>

type ThrownResponses = OrganizationNotFoundError | OrganizationIDNotProvided

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.organizationId)
    throw json('Organization ID is required', { status: 400 })

  const id = parseInt(params.organizationId)
  const organization = await db.organization.findUnique({
    where: {
      id,
    },
  })
  if (!organization)
    throw json('Organization does not exist', { status: 404 })

  return json({ organization })
}

export default function OrganizationPage() {
  const { organizationId } = useParams()
  const { organization } = useLoaderData<LoaderData>()

  return (
    <div>Organization {organizationId} {JSON.stringify(organization)}</div>
  )
}

export function CatchBoundary() {
  const error = useCatch<ThrownResponses>()

  return (
    <Center
      component={'section'}
      sx={theme => ({
        backgroundColor: theme.colorScheme === 'dark' ? theme.fn.rgba(theme.colors.red[9], 0.50) : theme.colors.red[4],
        height: '100%',
      })}>
      <Text weight={600} size={'xl'}>{error.status} {error.data}</Text>
    </Center>
  )
}
