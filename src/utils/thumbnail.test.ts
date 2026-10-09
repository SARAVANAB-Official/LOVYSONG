import { describe, expect, it } from 'vitest'
import { hiRes } from './thumbnail'

describe('hiRes', () => {
  it('upscales Google user-content size tokens', () => {
    expect(hiRes('https://yt3.ggpht.com/x=w120-h120-c-k-no0')).toBe('https://yt3.ggpht.com/x=w544-h544-c-k-no0')
    expect(hiRes('https://i.ytimg.com/vi/abc12345678/hqdefault.jpg')).toBe('https://i.ytimg.com/vi/abc12345678/hqdefault.jpg')
  })

  it('upgrades small YouTube thumbnails to hq', () => {
    expect(hiRes('https://i.ytimg.com/vi/abc12345678/mqdefault.jpg')).toBe('https://i.ytimg.com/vi/abc12345678/hqdefault.jpg')
    expect(hiRes('https://i.ytimg.com/vi/abc12345678/default.jpg')).toBe('https://i.ytimg.com/vi/abc12345678/hqdefault.jpg')
  })

  it('returns undefined for missing values and passes through unknown URLs', () => {
    expect(hiRes(null)).toBeUndefined()
    expect(hiRes(undefined)).toBeUndefined()
    expect(hiRes('')).toBeUndefined()
    expect(hiRes('https://example.com/art.png')).toBe('https://example.com/art.png')
  })

  it('honours a custom size', () => {
    expect(hiRes('https://x.com/a=w60-h60', 128)).toBe('https://x.com/a=w128-h128')
  })
})
