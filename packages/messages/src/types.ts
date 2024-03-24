import type { InlineKeyboardMarkup, InputFile, LinkPreviewOptions, ReplyKeyboardMarkup } from 'grammy/types'

export type MessageContent =
  | MessageTextContent
  | MessagePhotoContent

export interface MessageTextContent {
  type: 'text'
  text: string
  replyMarkup?: ReplyKeyboardMarkup | InlineKeyboardMarkup
}

export interface MessagePhotoContent {
  type: 'photo'
  file: string | InputFile
  caption?: string
  hasSpoiler?: boolean
  replyMarkup?: ReplyKeyboardMarkup | InlineKeyboardMarkup
}

export interface SendMessageOptions {
  silently?: boolean
  protectContent?: boolean
  linkPreviewOptions?: LinkPreviewOptions
}

export interface EditMessageOptions {
  linkPreviewOptions?: LinkPreviewOptions
}
