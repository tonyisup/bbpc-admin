import { config } from 'dotenv'
import fs from 'fs'

if (fs.existsSync('.env.local')) {
	config({ path: '.env.local' })
} else {
	config()
}
import { defineConfig } from 'prisma/config'

const databaseUrl = process.env.DATABASE_URL

export default defineConfig({
	// Schema location
	schema: 'prisma/schema.prisma',

	// Prisma types are still generated for archived SQL-only modules, but the
	// production Convex build no longer carries a SQL connection string.
	...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),

	// Migration settings
	migrations: {
		path: 'prisma/migrations',
	},
})
