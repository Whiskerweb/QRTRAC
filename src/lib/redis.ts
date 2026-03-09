import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const SHORTLINK_PREFIX = 'shortlink'

function getDefaultDomain(): string {
    const appUrl = process.env.NEXT_PUBLIC_TRAAACTION_URL || 'https://traaaction.com'
    try {
        const url = new URL(appUrl)
        return url.hostname
    } catch {
        return 'traaaction.com'
    }
}

function buildLinkKey(slug: string, domain?: string): string {
    return `${SHORTLINK_PREFIX}:${domain || getDefaultDomain()}:${slug}`
}

export interface RedisLinkData {
    url: string
    linkId: string
    workspaceId: string
    sellerId?: string | null
    ogTitle?: string | null
    ogDescription?: string | null
    ogImage?: string | null
}

export async function setLinkInRedis(
    slug: string,
    data: RedisLinkData,
    domain?: string
): Promise<void> {
    const key = buildLinkKey(slug, domain)
    await redis.set(key, JSON.stringify(data))

    const defaultDomain = getDefaultDomain()
    if (domain && domain !== defaultDomain) {
        const fallbackKey = buildLinkKey(slug, defaultDomain)
        await redis.set(fallbackKey, JSON.stringify(data))
    }
}

export async function deleteLinkFromRedis(
    slug: string,
    domain?: string
): Promise<void> {
    const key = buildLinkKey(slug, domain)
    await redis.del(key)

    const defaultDomain = getDefaultDomain()
    if (domain && domain !== defaultDomain) {
        const fallbackKey = buildLinkKey(slug, defaultDomain)
        await redis.del(fallbackKey)
    }
}
