import type { Api, Context, NextFunction } from 'grammy'
import type { Message } from 'grammy/types'
import type { TgxElement } from '@telegum/tgx'
import type { EditMessageOptions, MessageContent, SendMessageOptions } from './types'
import { tgxToMessageContent } from './tgx'

type SendTo = (chatId: number | string, threadId?: number) => Promise<Message>
type EditTo = (newMessage: TgxElement) => Promise<Message>

export interface MessagesFlavor {
  send: (message: TgxElement) => ({
    to: SendTo
    with: (options: Partial<SendMessageOptions>) => ({
      to: SendTo
    })
  })
  edit: (chatId: number | string, messageId: number) => ({
    to: EditTo
    with: (options: EditMessageOptions) => ({
      to: EditTo
    })
  })
}

export async function messages<C extends Context & MessagesFlavor>(ctx: C, next: NextFunction) {
  ctx.send = (message: TgxElement) => ({
    to: async (chatId: number | string, threadId?: number) => {
      const content = tgxToMessageContent(message)
      return sendMessageContent({
        api: ctx.api,
        content,
        chatId,
        threadId,
      })
    },
    with: (options: Partial<SendMessageOptions>) => ({
      to: async (chatId: number | string, threadId?: number) => {
        const content = tgxToMessageContent(message)
        return sendMessageContent({
          api: ctx.api,
          content,
          chatId,
          threadId,
          options,
        })
      },
    }),
  })

  ctx.edit = (chatId: number | string, messageId: number) => ({
    to: async (newMessage: TgxElement) => {
      const content = tgxToMessageContent(newMessage)
      return editMessageContent({
        api: ctx.api,
        content,
        chatId,
        messageId,
      })
    },
    with: (options: EditMessageOptions) => ({
      to: async (newMessage: TgxElement) => {
        const content = tgxToMessageContent(newMessage)
        return editMessageContent({
          api: ctx.api,
          content,
          chatId,
          messageId,
          options,
        })
      },
    }),
  })

  return next()
}

function sendMessageContent({
  api,
  content,
  chatId,
  threadId,
  options,
}: {
  api: Api
  content: MessageContent
  chatId: number | string
  threadId?: number
  options?: SendMessageOptions
}): Promise<Message> {
  switch (content.type) {
    case 'text':
      return api.sendMessage(
        chatId,
        content.text,
        {
          message_thread_id: threadId,
          parse_mode: 'HTML',
          disable_notification: options?.silently,
          protect_content: options?.protectContent,
          link_preview_options: options?.linkPreviewOptions,
        },
      )
    case 'photo':
      return api.sendPhoto(
        chatId,
        content.file,
        {
          message_thread_id: threadId,
          caption: content.caption,
          parse_mode: 'HTML',
          has_spoiler: content.hasSpoiler,
          disable_notification: options?.silently,
          protect_content: options?.protectContent,
        },
      )
  }
}

function editMessageContent({
  api,
  content,
  chatId,
  messageId,
  options,
}: {
  api: Api
  content: MessageContent
  chatId: number | string
  messageId: number
  options?: EditMessageOptions
}): Promise<Message> {
  if (content.replyMarkup && !('inline_keyboard' in content.replyMarkup))
    throw new Error('Only inline keyboard is supported for editing messages')

  switch (content.type) {
    case 'text':
      return api.editMessageText(
        chatId,
        messageId,
        content.text,
        {
          parse_mode: 'HTML',
          link_preview_options: options?.linkPreviewOptions,
          reply_markup: content.replyMarkup,
        },
      ) as Promise<Message>
    case 'photo':
      return api.editMessageCaption(
        chatId,
        messageId,
        {
          caption: content.caption,
          parse_mode: 'HTML',
          reply_markup: content.replyMarkup,
        },
      ) as Promise<Message>
  }
}
