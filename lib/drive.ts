export interface DriveImage {
  id: string
  name: string
  thumbnailLink: string
  webContentLink: string
}

export async function getFolderImages(folderUrl: string): Promise<DriveImage[]> {
  const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/)
  if (!match) return []
  const folderId = match[1]

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files` +
      `?q=%27${folderId}%27+in+parents+and+mimeType+contains+%27image/%27` +
      `&fields=files(id,name,thumbnailLink,webContentLink)` +
      `&key=${process.env.GOOGLE_DRIVE_API_KEY}`,
    { next: { revalidate: 300 } } as RequestInit
  )

  if (!res.ok) return []
  const json = await res.json()
  return json.files ?? []
}
