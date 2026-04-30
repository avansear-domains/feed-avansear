interface WorkerObject {
  body: ReadableStream | null
  httpMetadata?: { contentType?: string; cacheControl?: string }
}

interface WorkerBucket {
  get(key: string): Promise<WorkerObject | null>
  put(
    key: string,
    value: ArrayBuffer,
    options: { httpMetadata: { contentType: string; cacheControl: string } }
  ): Promise<void>
}

export interface Env {
  BUCKET: WorkerBucket
}

const MAX_FILE_SIZE = 25 * 1024 * 1024

function sanitizeObjectKey(pathname: string): string {
  const raw = pathname.replace(/^\/+/, '')
  const parts = raw
    .split('/')
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, ''))
    .filter(Boolean)
  return parts.join('/')
}

function corsHeaders(extra: Record<string, string> = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    ...extra,
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    const url = new URL(request.url)
    const key = sanitizeObjectKey(url.pathname)

    if (request.method === 'GET') {
      if (!key) {
        return new Response(
          JSON.stringify({
            message: 'Feed worker is up',
            usage: {
              upload: 'PUT /path/to/object.ext',
              fetch: 'GET /path/to/object.ext',
            },
          }),
          {
            status: 200,
            headers: corsHeaders({ 'Content-Type': 'application/json' }),
          }
        )
      }

      const object = await env.BUCKET.get(key)
      if (!object) {
        return new Response('Not found', { status: 404, headers: corsHeaders() })
      }

      return new Response(object.body, {
        status: 200,
        headers: corsHeaders({
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          'Cache-Control': object.httpMetadata?.cacheControl || 'public, max-age=31536000, immutable',
        }),
      })
    }

    if (request.method === 'PUT') {
      if (!key) {
        return new Response(JSON.stringify({ error: 'missing object key' }), {
          status: 400,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
        })
      }

      const contentLength = Number(request.headers.get('Content-Length') || 0)
      if (contentLength > MAX_FILE_SIZE) {
        return new Response(JSON.stringify({ error: 'max file size is 25MB' }), {
          status: 413,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
        })
      }

      const body = await request.arrayBuffer()
      if (body.byteLength === 0) {
        return new Response(JSON.stringify({ error: 'empty file' }), {
          status: 400,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
        })
      }

      if (body.byteLength > MAX_FILE_SIZE) {
        return new Response(JSON.stringify({ error: 'max file size is 25MB' }), {
          status: 413,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
        })
      }

      const contentType = request.headers.get('Content-Type') || 'application/octet-stream'
      const cacheControl =
        request.headers.get('Cache-Control') || 'public, max-age=31536000, immutable'

      await env.BUCKET.put(key, body, {
        httpMetadata: {
          contentType,
          cacheControl,
        },
      })

      return new Response(
        JSON.stringify({
          ok: true,
          objectKey: key,
          url: `${url.origin}/${key}`,
        }),
        {
          status: 200,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
        }
      )
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders() })
  },
}
