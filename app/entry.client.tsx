import { RemixBrowser } from '@remix-run/react'
import { hydrateRoot } from 'react-dom/client'
import { startTransition } from 'react'

requestIdleCallback(() => {
    startTransition(() => {
        hydrateRoot(document, <RemixBrowser />)
    })
})
