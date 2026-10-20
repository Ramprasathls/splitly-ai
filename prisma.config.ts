import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next reads .env.local; load the same file so the CLI and the app agree.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
