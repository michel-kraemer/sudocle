import { BitInputStream } from "@thi.ng/bitstream"

/**
 * Reverse the bit order of an 8-bit integer
 */
function reverseBits8(n: number): number {
  n = ((n >> 1) & 0x55) | ((n & 0x55) << 1)
  n = ((n >> 2) & 0x33) | ((n & 0x33) << 2)
  n = ((n >> 4) & 0x0f) | ((n & 0x0f) << 4)
  return n
}

/**
 * Reverse the bit order of a 16-bit integer
 */
function reverseBits16(n: number): number {
  n = ((n >> 1) & 0x5555) | ((n & 0x5555) << 1)
  n = ((n >> 2) & 0x3333) | ((n & 0x3333) << 2)
  n = ((n >> 4) & 0x0f0f) | ((n & 0x0f0f) << 4)
  n = ((n >> 8) & 0x00ff) | ((n & 0x00ff) << 8)
  return n
}

/**
 * Reverse the bit order of a 32-bit integer
 */
function reverseBits32(n: number): number {
  n = ((n >> 1) & 0x55555555) | ((n & 0x55555555) << 1)
  n = ((n >> 2) & 0x33333333) | ((n & 0x33333333) << 2)
  n = ((n >> 4) & 0x0f0f0f0f) | ((n & 0x0f0f0f0f) << 4)
  n = ((n >> 8) & 0x00ff00ff) | ((n & 0x00ff00ff) << 8)
  n = ((n >> 16) & 0x0000ffff) | ((n & 0x0000ffff) << 16)
  return n
}

/**
 * Reverse the bit order of an integer with the given width (in bits)
 */
function reverseBits(n: number, width: number): number {
  let r: number
  if (width <= 8) {
    r = reverseBits8(n)
    r >>= 8 - width
  } else if (width <= 16) {
    r = reverseBits16(n)
    r >>= 16 - width
  } else {
    r = reverseBits32(n)
    r >>= 32 - width
  }
  return r
}

/**
 * Decompresses an f-puzzles compressed buffer. f-puzzles uses a modified
 * variant of the LWZ compression algorithm. The basic structure is as follows:
 *
 * - The input buffer consists of entries with varying bit sizes (widths)
 * - While interpreting the input stream, the algorithm builds a dictionary
 *   similar to LZW
 * - At the beginning, the algorithm reads the first entry, which has a width
 *   of two bits. Let's call it prefix.
 * - The prefix can have the following values:
 *   - 0: The next 8 bits in the stream respresent a character that should be
 *        added to the result
 *   - 1: The next 16 bits in the stream respresent a character that should be
 *        added to the result
 *   - 2: The end of the stream has been reached
 *   - Any other value indexes an entry in the dictionary. This entry should
 *     be added to the result.
 * - The algorithm continues reading prefixes (and characters if necessary),
 *   extends the dictionary, and builds the result
 * - The bits of prefixes and characters are flipped (for whatever reason)
 * - As soon as the dictionary reaches a certain power-of-two size
 *   (4, 8, 16, etc.), the bit-width of the prefixes read is increased by one,
 *   so dictionary entries with higher indices can be addressed.
 */
export default function lzwDecompress(input: Buffer): string | undefined {
  // the first two entries stay empty to leave room for the
  // control prefixes '0' and '1'
  let dictionary = ["", ""]

  // we start with a prefix width of two bits and increase it as soon as
  // the dictionary reaches a size that cannot represented anymore with 2 bits
  let prefixWidth = 2
  let maxDictionarySize = Math.pow(2, prefixWidth)

  // result string
  let result = []

  // add an entry to the dictionary and increase prefix width if necessary
  function pushDictionary(c: string) {
    dictionary.push(c)
    if (dictionary.length === maxDictionarySize) {
      ++prefixWidth
      maxDictionarySize = Math.pow(2, prefixWidth)
    }
  }

  let w = ""
  let bis = new BitInputStream(input)
  while (bis.position < bis.length - prefixWidth) {
    let i = reverseBits(bis.read(prefixWidth), prefixWidth)

    if (i === 0) {
      pushDictionary(String.fromCharCode(reverseBits8(bis.read(8))))
      i = dictionary.length - 1
    } else if (i === 1) {
      pushDictionary(String.fromCharCode(reverseBits16(bis.read(16))))
      i = dictionary.length - 1
    } else if (i === 2) {
      // end of stream has been reached
      return result.join("")
    }

    let c: string
    if (i < dictionary.length) {
      c = dictionary[i]
    } else {
      if (i === dictionary.length) {
        c = w + w[0]
      } else {
        return undefined
      }
    }
    result.push(c)

    pushDictionary(w + c[0])

    w = c
  }

  return result.join("")
}
