export function parseDriveId(input: string): string {
  const fileMatch = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return fileMatch[1]

  const idMatch = input.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) return idMatch[1]

  return input.trim()
}

export function parseFolderUrl(input: string): string {
  const folderMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (folderMatch) return folderMatch[1]
  return input.trim()
}
