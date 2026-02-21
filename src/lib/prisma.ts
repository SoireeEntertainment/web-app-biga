import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const isSqlite = databaseUrl.startsWith("file:");

const sqlitePath = isSqlite
  ? path.resolve(process.cwd(), databaseUrl.replace(/^file:/, "").replace(/^\.\//, ""))
  : "";
const adapter = isSqlite
  ? new PrismaBetterSqlite3({ url: sqlitePath || path.join(process.cwd(), "prisma", "dev.db") })
  : new PrismaPg({ connectionString: databaseUrl });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
