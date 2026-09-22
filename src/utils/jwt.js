export function parseJwtPayload(token) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

export function getClubIdFromToken(token) {
  const payload = parseJwtPayload(token)
  if (!payload) return null
  return payload.club_id || payload.club_slug || null
}

export function clubIdsMatch(candidate, clubId, clubSlug) {
  if (!candidate) return false
  const key = String(candidate).trim().toLowerCase()
  const id = (clubId || '').toLowerCase()
  const slug = (clubSlug || '').toLowerCase()
  return key === id || key === slug
}

export function tokenMatchesHostTenant(token, clubId, clubSlug) {
  const tokenClub = getClubIdFromToken(token)
  if (!tokenClub) return true
  if (!clubId && !clubSlug) return true
  return clubIdsMatch(tokenClub, clubId, clubSlug)
}
