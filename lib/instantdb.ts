// InstantDB configuration and database hooks for research history persistence
import { init, id } from '@instantdb/react'

// InstantDB App ID - replace with your own from https://instantdb.com/dash
const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID || ''

// UUID format validation
const isValidUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

// Define the schema types for our database
interface ResearchSession {
  id: string
  query: string
  model: string
  reportContent: string
  sources: string  // JSON stringified array of source URLs
  duration: number // research duration in milliseconds
  wordCount: number
  createdAt: number // timestamp
  updatedAt: number // timestamp
}

// Only initialize InstantDB if a valid appId is configured
const db = isValidUUID(APP_ID) ? init({ appId: APP_ID }) : null

// Export the db instance and id helper
export { db, id }
export type { ResearchSession }
