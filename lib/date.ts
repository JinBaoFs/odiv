import type { Locale } from "@/lib/mdx-posts"

function parseDate(date: string | Date): Date {
  if (date instanceof Date) return date

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  }

  return new Date(date)
}

export function getDateYear(date: string | Date): number {
  const parsedDate = parseDate(date)
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date: ${String(date)}`)
  }
  return parsedDate.getUTCFullYear()
}

export function formatPostDate(date: string | Date, locale: Locale): string {
  const parsedDate = parseDate(date)
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date: ${String(date)}`)
  }

  if (locale === "zh") {
    return `${parsedDate.getUTCMonth() + 1}月${parsedDate.getUTCDate()}日`
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsedDate)
}

export function formatPostFullDate(date: string | Date, locale: Locale): string {
  const parsedDate = parseDate(date)
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date: ${String(date)}`)
  }

  if (locale === "zh") {
    return `${parsedDate.getUTCFullYear()}年${parsedDate.getUTCMonth() + 1}月${parsedDate.getUTCDate()}日`
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsedDate)
}
