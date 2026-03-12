/**
 * Tinybird Analytics Integration for QR App
 * Queries the same Tinybird instance as the main Traaaction app
 */

const TINYBIRD_HOST = process.env.NEXT_PUBLIC_TINYBIRD_HOST || 'https://api.europe-west2.gcp.tinybird.co'
const TINYBIRD_ADMIN_TOKEN = process.env.TINYBIRD_ADMIN_TOKEN

export async function executeTinybirdSQL(sql: string): Promise<any> {
    if (!TINYBIRD_ADMIN_TOKEN) {
        throw new Error('TINYBIRD_ADMIN_TOKEN not configured')
    }

    const response = await fetch(`${TINYBIRD_HOST}/v0/sql`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TINYBIRD_ADMIN_TOKEN}`,
            'Content-Type': 'text/plain',
        },
        body: sql,
        cache: 'no-store' as RequestCache,
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Tinybird SQL error: ${response.status} - ${errorText}`)
    }

    return response.json()
}

export function isTinybirdConfigured(): boolean {
    return !!TINYBIRD_ADMIN_TOKEN
}

// SQL sanitization helpers

export function sanitizeUUID(uuid: string | null | undefined): string | null {
    if (!uuid || typeof uuid !== 'string') return null
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid) ? uuid : null
}

export function escapeSQLString(value: string | null | undefined): string | null {
    if (!value || typeof value !== 'string') return null
    return value
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "''")
        .replace(/"/g, '\\"')
        .replace(/\x00/g, '')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/;/g, '')
        .replace(/--/g, '')
}

export function sanitizeDateString(date: string | null | undefined): string | null {
    if (!date || typeof date !== 'string') return null
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/
    return isoDateRegex.test(date) ? date : null
}

// Region/continent mappings for breakdown filters

export const REGION_TO_CITIES: Record<string, string[]> = {
    'Île-de-France': ['Paris', 'Versailles', 'Saint-Denis', 'Boulogne-Billancourt'],
    'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Saint-Étienne'],
    'Provence-Alpes-Côte d\'Azur': ['Marseille', 'Nice', 'Toulon'],
    'Nouvelle-Aquitaine': ['Bordeaux', 'Limoges', 'Poitiers'],
    'Occitanie': ['Toulouse', 'Montpellier', 'Nîmes'],
    'Hauts-de-France': ['Lille', 'Amiens', 'Roubaix'],
    'Normandie': ['Rouen', 'Le Havre', 'Caen'],
    'Grand Est': ['Strasbourg', 'Reims', 'Metz'],
}

export const CONTINENT_TO_COUNTRIES: Record<string, string[]> = {
    'Europe': ['France', 'Germany', 'United Kingdom', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Poland', 'Austria', 'Portugal', 'Sweden', 'Norway', 'Denmark', 'Finland'],
    'North America': ['United States', 'Canada', 'Mexico'],
    'Asia': ['Japan', 'China', 'India', 'South Korea', 'Singapore', 'Thailand', 'Vietnam', 'Indonesia'],
    'South America': ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru'],
    'Africa': ['South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Morocco'],
    'Oceania': ['Australia', 'New Zealand'],
}

export const COUNTRY_FLAGS: Record<string, string> = {
    'France': '\u{1F1EB}\u{1F1F7}', 'United States': '\u{1F1FA}\u{1F1F8}',
    'Germany': '\u{1F1E9}\u{1F1EA}', 'United Kingdom': '\u{1F1EC}\u{1F1E7}',
    'Spain': '\u{1F1EA}\u{1F1F8}', 'Italy': '\u{1F1EE}\u{1F1F9}',
    'Canada': '\u{1F1E8}\u{1F1E6}', 'Netherlands': '\u{1F1F3}\u{1F1F1}',
    'Belgium': '\u{1F1E7}\u{1F1EA}', 'Switzerland': '\u{1F1E8}\u{1F1ED}',
    'Japan': '\u{1F1EF}\u{1F1F5}', 'Australia': '\u{1F1E6}\u{1F1FA}',
    'Brazil': '\u{1F1E7}\u{1F1F7}', 'Mexico': '\u{1F1F2}\u{1F1FD}',
    'India': '\u{1F1EE}\u{1F1F3}', 'China': '\u{1F1E8}\u{1F1F3}',
    'Morocco': '\u{1F1F2}\u{1F1E6}', 'Portugal': '\u{1F1F5}\u{1F1F9}',
    'Poland': '\u{1F1F5}\u{1F1F1}',
}

/**
 * Build WHERE clauses for dimensional filters on clicks table
 */
export function buildClicksFilterSQL(filters: {
    country?: string
    city?: string
    region?: string
    continent?: string
    device?: string
    browser?: string
    os?: string
}): string {
    const clauses: string[] = []

    let allCountries: string[] = []
    if (filters.country) {
        allCountries.push(...filters.country.split(',').map(c => c.trim()))
    }
    if (filters.continent) {
        filters.continent.split(',').forEach(continent => {
            const countries = CONTINENT_TO_COUNTRIES[continent.trim()] || []
            allCountries.push(...countries)
        })
    }
    if (allCountries.length > 0) {
        const unique = [...new Set(allCountries)]
        const escaped = unique.map(c => `'${escapeSQLString(c) || ''}'`).join(',')
        clauses.push(`country IN (${escaped})`)
    }

    let allCities: string[] = []
    if (filters.city) {
        allCities.push(...filters.city.split(',').map(c => c.trim()))
    }
    if (filters.region) {
        filters.region.split(',').forEach(region => {
            const cities = REGION_TO_CITIES[region.trim()] || []
            allCities.push(...cities)
        })
    }
    if (allCities.length > 0) {
        const unique = [...new Set(allCities)]
        const escaped = unique.map(c => `'${escapeSQLString(c) || ''}'`).join(',')
        clauses.push(`city IN (${escaped})`)
    }

    if (filters.device) {
        const devices = filters.device.split(',').map(d => `'${escapeSQLString(d.trim()) || ''}'`).join(',')
        clauses.push(`device IN (${devices})`)
    }

    if (filters.browser) {
        const conditions = filters.browser.split(',').map(b => {
            const browser = b.trim()
            if (browser === 'Edge') return "positionCaseInsensitive(user_agent, 'Edg') > 0"
            if (browser === 'Chrome') return "(positionCaseInsensitive(user_agent, 'Chrome') > 0 AND positionCaseInsensitive(user_agent, 'Edg') = 0)"
            if (browser === 'Safari') return "(positionCaseInsensitive(user_agent, 'Safari') > 0 AND positionCaseInsensitive(user_agent, 'Chrome') = 0)"
            if (browser === 'Firefox') return "positionCaseInsensitive(user_agent, 'Firefox') > 0"
            if (browser === 'Opera') return "(positionCaseInsensitive(user_agent, 'Opera') > 0 OR positionCaseInsensitive(user_agent, 'OPR') > 0)"
            return `positionCaseInsensitive(user_agent, '${escapeSQLString(browser) || ''}') > 0`
        })
        clauses.push(`(${conditions.join(' OR ')})`)
    }

    if (filters.os) {
        const conditions = filters.os.split(',').map(o => {
            const os = o.trim()
            if (os === 'Windows') return "positionCaseInsensitive(user_agent, 'Windows') > 0"
            if (os === 'macOS') return "(positionCaseInsensitive(user_agent, 'Mac OS X') > 0 OR positionCaseInsensitive(user_agent, 'Macintosh') > 0)"
            if (os === 'iOS') return "(positionCaseInsensitive(user_agent, 'iPhone') > 0 OR positionCaseInsensitive(user_agent, 'iPad') > 0)"
            if (os === 'Android') return "positionCaseInsensitive(user_agent, 'Android') > 0"
            if (os === 'Linux') return "positionCaseInsensitive(user_agent, 'Linux') > 0"
            return `positionCaseInsensitive(user_agent, '${escapeSQLString(os) || ''}') > 0`
        })
        clauses.push(`(${conditions.join(' OR ')})`)
    }

    return clauses.length > 0 ? 'AND ' + clauses.join(' AND ') : ''
}
