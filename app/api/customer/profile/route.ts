import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyCustomerSession } from '@/app/api/_lib/customer-auth'
import { customerController } from '@/app/api/_lib/controllers/customerController'

/** PATCH /api/customer/profile — Authenticated. Update name and/or phone. */
export async function PATCH(req: NextRequest) {
  const customer = await verifyCustomerSession(req)
  if (!customer) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await customerController.updateProfile(customer.id, body)
  return NextResponse.json(result.data, { status: result.status })
}
