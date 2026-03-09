import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
    // Detect locale from Accept-Language header or default to 'fr'
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const acceptLanguage = headersList.get('accept-language') || ''

    let locale = 'fr'
    if (acceptLanguage.startsWith('en')) locale = 'en'
    else if (acceptLanguage.startsWith('es')) locale = 'es'

    const messages = (await import(`../../messages/${locale}.json`)).default

    return { locale, messages }
})
