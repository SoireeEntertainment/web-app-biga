import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOrderStatusSchema } from "@/lib/validations";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await _request.json();
  const parsed = adminOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const order = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json(order);
}
