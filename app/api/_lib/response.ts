import { NextResponse } from 'next/server'

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status })
}

export function created<T>(data: T) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status: 201 })
}

export function err(message: string, status = 400) {
  return NextResponse.json<ApiResponse>({ success: false, error: message }, { status })
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}
