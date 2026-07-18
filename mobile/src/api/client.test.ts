import { describe, it, expect } from 'vitest'
import { getApiError } from './client'

describe('getApiError', () => {
    it('returns fallback when no response data', () => {
        expect(getApiError({}, 'Request Failed')).toBe('Request Failed')
    })

    it('returns string body', () => {
        expect(getApiError({ response: { data: 'Nope' }})).toBe('Nope')
    })
    
    it('returns data error', () =>{
        expect(getApiError({ response: { data: { error: 'X' }}})).toBe('X')
    })
    it('returns error detail', () => {
        expect(getApiError({ response: { data: { detail: 'its bad' }}})).toBe('its bad')
    })
    it ('return non_field_errrors', () => {
        expect(getApiError({ response: { data: { non_field_errors: ['a','b']}}})).toBe('a, b')
    })
    it ('returns field errors', () =>{
        expect(getApiError({ response: { data: { email: ['requiered']}}})).toBe('email: requiered')
    })
    it ('retunrs e.message when no data', () => {
        expect(getApiError({message: 'Network Error'})).toBe('Network Error')
    })
})