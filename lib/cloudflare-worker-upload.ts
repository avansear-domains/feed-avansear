function getWorkerUrl(): string {
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL
  if (!workerUrl) {
    throw new Error('Missing CLOUDFLARE_WORKER_URL')
  }
  return workerUrl.replace(/\/$/, '')
}

export function isWorkerUploadConfigured(): boolean {
  return Boolean(process.env.CLOUDFLARE_WORKER_URL)
}

export async function uploadBufferViaWorker(args: {
  buffer: Uint8Array
  extension: string
  contentType: string
}): Promise<{ objectKey: string; url: string }> {
  const workerUrl = getWorkerUrl()
  const ext = args.extension.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const objectKey = `feed/${Date.now()}-${crypto.randomUUID()}.${ext}`
  const encodedKey = objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

  const response = await fetch(`${workerUrl}/${encodedKey}`, {
    method: 'PUT',
    headers: {
      'Content-Type': args.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    body: Buffer.from(args.buffer),
  })

  const data = (await response.json().catch(() => ({}))) as {
    url?: string
    objectKey?: string
    error?: string
  }

  if (!response.ok) {
    throw new Error(data.error || `Worker upload failed: HTTP ${response.status}`)
  }

  return {
    objectKey: data.objectKey || objectKey,
    url: data.url || `${workerUrl}/${objectKey}`,
  }
}
