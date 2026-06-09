export interface DriveImage {
  id: string
  name: string
}

export function parseDriveId(input: string): string {
  const fileMatch = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return fileMatch[1]

  const idMatch = input.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) return idMatch[1]

  return input.trim()
}

export function driveThumbUrl(id: string, width = 400): string {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`
}

export async function getFolderImages(folderUrl: string): Promise<DriveImage[]> {
  const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/)
  if (!match) return []
  const folderId = match[1]

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files` +
      `?q=%27${folderId}%27+in+parents+and+mimeType+contains+%27image/%27` +
      `&fields=files(id,name)` +
      `&key=${process.env.GOOGLE_DRIVE_API_KEY}`,
    { next: { revalidate: 300 } } as RequestInit
  )

  if (!res.ok) return []
  const json = await res.json()
  return json.files ?? []
}
