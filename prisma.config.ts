import { config } from 'dotenv'
import fs from 'fs'

if (fs.existsSync('.env.local')) {
	config({ path: '.env.local' })
} else {
	config()
}
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
	// Schema location
	schema: 'prisma/schema.prisma',

	// Database connection URL
	datasource: {
		url: env('DATABASE_URL'),
	},

	// Migration settings
	migrations: {
		path: 'prisma/migrations',
	},
})
