/* eslint-disable ts/ban-types */

import crypto from 'node:crypto'
import type { Context, Filter } from 'grammy'
import type { TgxButtonElement } from '@telegum/tgx'

export interface Button<P = null> {
  (props: (P extends null ? {} : P) & { children: string }): TgxButtonElement
  filter: <C extends Context = Context>(ctx: C) => ctx is (Filter<C, 'callback_query:data'> & { payload: P })
  data: (payload: P) => string
}

export function makeButton(options: {
  id: string
}): Button<null>
export function makeButton<P extends {} = {}>(options: {
  id: string
  encode: (payload: P) => string
  decode: (data: string) => P
}): Button<P>
export function makeButton<P>(options: any): Button<P> {
  const id = options.id
  const encode = (options.encode ?? (() => '')) as (payload: P) => string
  const decode = (options.decode ?? (() => null)) as (data: string) => P

  const getData = (payload: P) => `${getButtonPrefixById(id)}${encode(payload)}`

  const btn = ({ children, ...payload }: any) => (
    <button data={getData(payload)}>
      {children}
    </button>
  ) as TgxButtonElement

  btn.filter = <C extends Context>(ctx: C): ctx is (Filter<C, 'callback_query:data'> & { payload: P }) => {
    const data = ctx.callbackQuery?.data
    if (data !== undefined) {
      const parseResult = parseCallbackData(id, data, decode)
      if (parseResult.ok) {
        (ctx as C & { payload: P }).payload = parseResult.payload
        return true
      }
    }
    return false
  }

  btn.data = getData

  return btn
}

function parseCallbackData<P>(
  id: string,
  data: string,
  decoder: (data: string) => P,
): { ok: false } | { ok: true, payload: P } {
  const prefix = getButtonPrefixById(id)
  if (!data.startsWith(prefix))
    return { ok: false }

  const payloadEncoded = data.slice(prefix.length)
  return {
    ok: true,
    payload: decoder(payloadEncoded),
  }
}

function getButtonPrefixById(id: string): string {
  const idHash = crypto
    .createHash('sha1')
    .update(id)
    .digest('hex')
    .slice(0, 8)
  return `#${idHash}:`
}
