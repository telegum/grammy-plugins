import { InlineKeyboard } from 'grammy'
import type { TextEntity, TgxElement, TgxFragmentElement, TgxKeyboardElement, TgxPhotoElement, TgxPlainElement, TgxTextElement, TgxVideoElement } from '@telegum/tgx'
import type { MessageContent } from './types'
import { sanitizeHtml } from './sanitize-html'

/**
 * Converts TGX elements tree to the `MessageContent`, automatically detecting
 * suitable content type.
 */
export function tgxToMessageContent(tgx: TgxElement): MessageContent {
  const rootElements = flattenTgx(tgx)

  let keyboard: InlineKeyboard | undefined
  const rest: (TgxTextElement | TgxPlainElement)[] = []
  const photos: TgxPhotoElement[] = []
  const videos: TgxVideoElement[] = []

  for (const element of rootElements) {
    switch (element.type) {
      case 'photo':
        photos.push(element)
        break
      case 'video':
        videos.push(element)
        break
      case 'keyboard':
        if (keyboard)
          throw new Error('Multiple keyboards are not allowed')
        keyboard = tgxToKeyboard(element)
        break
      case 'button':
        throw new Error('Button elements can only be used inside a keyboard element')
      case 'text':
      case 'plain':
        rest.push(element)
        break
      default:
        throw new Error(`Unsupported element: ${element satisfies never}`)
    }
  }

  const textHtml = tgxToTelegramHtml(rest) || undefined
  if (photos.length + videos.length > 1) {
    throw new Error('Media groups are not supported yet')
  }
  else if (photos.length === 0 && videos.length === 1) {
    throw new Error('Video messages are not supported yet')
  }
  else if (photos.length === 1 && videos.length === 0) {
    return {
      type: 'photo',
      file: photos[0].file,
      caption: textHtml,
      hasSpoiler: photos[0].spoiler,
      replyMarkup: keyboard,
    }
  }
  else if (textHtml) {
    return {
      type: 'text',
      text: textHtml,
      replyMarkup: keyboard,
    }
  }
  else {
    throw new Error('Empty message content')
  }
}

function tgxToKeyboard(tgx: TgxKeyboardElement): InlineKeyboard {
  const keyboard = new InlineKeyboard()
  for (const child of tgx.subelements) {
    if (child.type === 'button') {
      if (child.data)
        keyboard.text(child.text, child.data)
      else if (child.url)
        keyboard.url(child.text, child.url)
      else
        throw new Error('Ambiguous JSX button')
    }
    else {
      throw new Error(`Only button elements are allowed inside a keyboard (found ${child.type})`)
    }
  }
  return keyboard
}

function flattenTgx(root: TgxElement): (Exclude<TgxElement, TgxFragmentElement>)[] {
  const result: (Exclude<TgxElement, TgxFragmentElement>)[] = []
  const queue: TgxElement[] = [root]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.type === 'fragment')
      queue.push(...current.subelements)
    else
      result.push(current)
  }

  return result
}

function tgxToTelegramHtml(tgx: TgxElement[]): string {
  const parts: string[] = []
  for (const element of tgx) {
    if (element.type === 'plain') {
      const val = element.value
      if (typeof val === 'boolean' || val === null || val === undefined)
        continue

      parts.push(sanitizeHtml(String(val)))
    }
    else if (element.type === 'fragment') {
      parts.push(tgxToTelegramHtml(element.subelements))
    }
    else if (element.type === 'text') {
      parts.push(wrapTextWithEntity(
        tgxToTelegramHtml(element.subelements),
        element.entity,
      ))
    }
    else {
      throw new Error(`Unsupported element type within text: ${element.type}`)
    }
  }
  return parts.join('')
}

function wrapTextWithEntity(text: string, entity: TextEntity): string {
  switch (entity.type) {
    case 'bold':
      return `<b>${text}</b>`
    case 'italic':
      return `<i>${text}</i>`
    case 'underline':
      return `<u>${text}</u>`
    case 'strikethrough':
      return `<s>${text}</s>`
    case 'spoiler':
      return `<tg-spoiler>${text}</tg-spoiler>`
    case 'blockquote':
      return `<blockquote>${text}</blockquote>`
    case 'link':
      return `<a href="${entity.url}">${text}</a>`
    case 'custom-emoji':
      return `<tg-emoji emoji-id="${entity.id}">${text}</tg-emoji>`
    case 'code':
      return `<code>${text}</code>`
    case 'codeblock':
      if (entity.language)
        return `<pre><code class="language-${entity.language}">${text}</code></pre>`
      else
        return `<pre>${text}</pre>`
  }
}
