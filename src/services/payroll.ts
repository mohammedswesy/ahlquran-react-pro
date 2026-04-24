import api from "./api"
import { normalizeId } from "@/lib/normalize"

export type PayrollStatus = "paid" | "pending" | "processing" | "failed"

export type PayrollRow = {
  id: number
  employee_id: number
  employee_name: string
  month: number
  year: number
  base_salary: number
  allowances: number
  deductions: number
  net_salary: number
  status: PayrollStatus
  paid_at?: string | null
  [k: string]: any
}

export type PayrollParams = {
  month: number
  year: number
}

function normalizeStatus(value: any): PayrollStatus {
  const status = String(value ?? "pending").toLowerCase()
  if (status === "paid") return "paid"
  if (status === "processing") return "processing"
  if (status === "failed") return "failed"
  return "pending"
}

function toAmount(value: any): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function normalizePayroll(raw: any, params: PayrollParams): PayrollRow {
  const x = normalizeId(raw)
  const base = toAmount(x.base_salary ?? x.base ?? x.salary)
  const allowances = toAmount(x.allowances ?? x.bonus ?? x.extra)
  const deductions = toAmount(x.deductions ?? x.discount ?? x.penalties)

  return {
    ...x,
    id: Number(x.id ?? x.employee_id ?? 0),
    employee_id: Number(x.employee_id ?? x.employee?.id ?? x.id ?? 0),
    employee_name: String(x.employee_name ?? x.employee?.name ?? x.name ?? "").trim(),
    month: Number(x.month ?? params.month),
    year: Number(x.year ?? params.year),
    base_salary: base,
    allowances,
    deductions,
    net_salary: toAmount(x.net_salary ?? x.net ?? base + allowances - deductions),
    status: normalizeStatus(x.status),
    paid_at: x.paid_at ?? null,
  }
}

function extractPayrollRows(data: any, params: PayrollParams): PayrollRow[] {
  const src = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.rows)
        ? data.rows
        : Array.isArray(data?.payroll)
          ? data.payroll
          : []

  return src.map((row) => normalizePayroll(row, params)).filter((row) => row.employee_id > 0 && row.employee_name)
}

export async function listPayrollRows(params: PayrollParams): Promise<PayrollRow[]> {
  const endpoints = ["/admin/payroll", "/payroll", "/employees/payroll"]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint, { params })
      return extractPayrollRows(data?.data ?? data, params)
    } catch {
      continue
    }
  }

  return []
}

export async function markPayrollPaid(employeeId: number, params: PayrollParams) {
  const endpoints = [
    `/admin/payroll/${employeeId}/mark-paid`,
    `/payroll/${employeeId}/mark-paid`,
    `/employees/${employeeId}/payroll/mark-paid`,
  ]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.post(endpoint, params)
      return data?.data ?? data
    } catch {
      continue
    }
  }

  throw new Error("Failed to mark payroll as paid")
}

export async function payAllPayroll(params: PayrollParams) {
  const endpoints = ["/admin/payroll/pay-all", "/payroll/pay-all", "/employees/payroll/pay-all"]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.post(endpoint, params)
      return data?.data ?? data
    } catch {
      continue
    }
  }

  throw new Error("Failed to pay all payroll rows")
}