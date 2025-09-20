"use server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import Decimal from "decimal.js";

export async function createReport(title: string, fromISO: string, toISO: string) {
  const s = await getServerSession(); if (!s?.user) throw new Error("Unauthorized");
  const from = new Date(fromISO), to = new Date(toISO);
  const expenses = await prisma.expense.findMany({ where: { userId: s.user.id, reportId: null, date: { gte: from, lte: to } } });
  const total = expenses.reduce((acc, e) => acc.plus(new Decimal(e.amountHome.toString())), new Decimal(0)).toNumber();

  const report = await prisma.report.create({
    data: { userId: s.user.id, title, periodStart: from, periodEnd: to, total, status: "DRAFT", simpleState: "DRAFT" }
  });
  await prisma.expense.updateMany({ where: { id: { in: expenses.map(e=>e.id) } }, data: { reportId: report.id } });
  return { id: report.id };
}

export async function markReady(reportId:string){
  const s = await getServerSession(); if(!s?.user) throw new Error("Unauthorized");
  await prisma.report.update({ where: { id: reportId, userId: s.user.id }, data: { simpleState: "READY" } });
}

export async function lockAndExport(reportId:string){
  const s = await getServerSession(); if(!s?.user) throw new Error("Unauthorized");
  await prisma.report.update({ where: { id: reportId, userId: s.user.id }, data: { isLocked:true, simpleState:"EXPORTED", status:"APPROVED", approvedAt: new Date() } });
  // (Optional) also write a CSV to Drive using the Trip export pattern if you want per-report exports
}
