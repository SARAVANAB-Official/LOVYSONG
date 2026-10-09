import { describe, expect, it } from 'vitest'
import { activeLineIndex, parseLrc, parsePlain } from './lrc'

describe('parseLrc', () => {
  it('parses timestamped lines into seconds', () => {
    const lines = parseLrc('[00:12.50]Hello world\n[01:00]Second line')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatchObject({ time: 12.5, text: 'Hello world' })
    expect(lines[1]).toMatchObject({ time: 60, text: 'Second line' })
  })

  it('supports multiple time tags on one line', () => {
    const lines = parseLrc('[00:10.00][00:40.00]Chorus')
    expect(lines).toHaveLength(2)
    expect(lines.map((l) => l.time)).toEqual([10, 40])
    expect(lines.every((l) => l.text === 'Chorus')).toBe(true)
  })

  it('keeps untimed text as null-time lines (sorted last)', () => {
    const lines = parseLrc('[00:20]Later\nUntimed note')
    expect(lines).toEqual([
      { time: 20, text: 'Later' },
      { time: null, text: 'Untimed note' },
    ])
  })

  it('parses bracket hundredths and dot milliseconds', () => {
    expect(parseLrc('[00:03.750]a')[0].time).toBeCloseTo(3.75)
    expect(parseLrc('[0:03:25]b')[0].time).toBeCloseTo(3.25)
  })

  it('returns an empty array for empty input', () => {
    expect(parseLrc('')).toEqual([])
  })
})

describe('parsePlain', () => {
  it('drops blank lines and trims whitespace', () => {
    expect(parsePlain('  first \n\n   second\t\n')).toEqual([
      { time: null, text: 'first' },
      { time: null, text: 'second' },
    ])
  })
})

describe('activeLineIndex', () => {
  const lines = [
    { time: 10, text: 'a' },
    { time: null, text: 'b' },
    { time: 20, text: 'c' },
    { time: 30, text: 'd' },
  ]

  it('returns -1 before the first line', () => {
    expect(activeLineIndex(lines, 5)).toBe(-1)
  })

  it('returns the last line whose timestamp has passed', () => {
    expect(activeLineIndex(lines, 10)).toBe(0)
    expect(activeLineIndex(lines, 15)).toBe(0) // untimed lines are never highlighted
    expect(activeLineIndex(lines, 20.5)).toBe(2)
    expect(activeLineIndex(lines, 99)).toBe(3)
  })

  it('tolerates small clock drift', () => {
    expect(activeLineIndex(lines, 9.8)).toBe(-1)
    expect(activeLineIndex(lines, 9.9)).toBe(0) // within the 150ms grace window
  })
})
