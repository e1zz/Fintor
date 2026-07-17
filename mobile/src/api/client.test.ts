import { describe, it, expect } from 'vitest'
import { getApiError } from './client'

describe('getApiError', () => {
    it('returns fallback when no response data', () => {
        expect(getApiError({}, 'Request Failed')).toBe('Request Failed')
    })
})