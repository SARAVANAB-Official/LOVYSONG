import { describe, expect, it } from 'vitest'
import { formatCount, formatTime, greeting, parseDurationText, pluralize } from './format'

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(9)).toBe('0:09')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(599)).toBe('9:59')
  })

  it('uses hours for long content', () => {
    expect(formatTime(3661)).toBe('1:01:01')
    expect(formatTime(7325)).toBe('2:02:05')
  })

  it('handles invalid input safely', () => {
    expect(formatTime(null)).toBe('0:00')
    expect(formatTime(undefined)).toBe('0:00')
    expect(formatTime(Number.NaN)).toBe('0:00')
    expect(formatTime(-10)).toBe('0:00')
  })
})

describe('parseDurationText', () => {
  it('parses m:ss and h:mm:ss', () => {
    expect(parseDurationText('3:45')).toBe(225)
    expect(parseDurationText('1:02:11')).toBe(3731)
    expect(parseDurationText('0:09')).toBe(9)
  })

  it('returns null for unusable values', () => {
    expect(parseDurationText('')).toBeNull()
    expect(parseDurationText(null)).toBeNull()
    expect(parseDurationText('abc')).toBeNull()
    expect(parseDurationText('12')).toBeNull()
  })
})

describe('formatCount', () => {
  it('abbreviates large numbers', () => {
    expect(formatCount(0)).toBe('0')
    expect(formatCount(999)).toBe('999')
    expect(formatCount(1_000)).toBe('1.0K')
    expect(formatCount(1_500_000)).toBe('1.5M')
    expect(formatCount(2_100_000_000)).toBe('2.1B')
  })

  it('parses numeric strings and tolerates junk', () => {
    expect(formatCount('1200')).toBe('1.2K')
    expect(formatCount('nope')).toBe('')
    expect(formatCount(null)).toBe('')
  })
})

describe('greeting', () => {
  it('picks the right greeting for the hour', () => {
    expect(greeting(new Date('2026-01-01T07:30:00'))).toBe('Good morning')
    expect(greeting(new Date('2026-01-01T14:00:00'))).toBe('Good afternoon')
    expect(greeting(new Date('2026-01-01T21:00:00'))).toBe('Good evening')
    expect(greeting(new Date('2026-01-01T03:00:00'))).toBe('Good night')
  })
})

describe('pluralize', () => {
  it('handles singular and plural', () => {
    expect(pluralize(1, 'track')).toBe('1 track')
    expect(pluralize(0, 'track')).toBe('0 tracks')
    expect(pluralize(3, 'playlist')).toBe('3 playlists')
    expect(pluralize(2, 'box', 'boxes')).toBe('2 boxes')
  })
})
