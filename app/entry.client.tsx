import { RemixBrowser } from '@remix-run/react'
import { hydrate } from 'react-dom'
import { StrictMode } from 'react'
import { ClientProvider } from '@mantine/remix'

hydrate(
    <ClientProvider>
        <StrictMode>
            <RemixBrowser />
        </StrictMode>
    </ClientProvider>,
    document
)
