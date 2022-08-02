import { RemixBrowser } from '@remix-run/react'
import { hydrate } from 'react-dom'
import { StrictMode } from 'react'

hydrate(
    <StrictMode>
        <RemixBrowser />
    </StrictMode>,
    document
)
