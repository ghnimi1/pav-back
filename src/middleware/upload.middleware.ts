import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'

const uploadsDir = path.join(process.cwd(), 'uploads', 'menu')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg'
    const base = path.basename(file.originalname || 'image', ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    cb(null, `${Date.now()}-${base || 'image'}${ext}`)
  },
})

function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Seuls les fichiers image sont autorises'))
    return
  }

  cb(null, true)
}

export const uploadMenuImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

export function getUploadedImagePath(file?: Express.Multer.File) {
  if (!file) return undefined
  return `${file.filename}`
}

export function getLocalUploadAbsolutePath(imagePath?: string) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return null
  return path.join(process.cwd(), imagePath.replace(/^\//, '').replace(/\//g, path.sep))
}
