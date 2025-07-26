import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import characters from './characters'

const app = new Hono().basePath('/api')

const routes = app.route("/characters", characters)

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)

// Exportar o tipo correto da app, não da route específica
export type AppType = typeof routes