import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  maxSizeMB?: number
}

export default function ImageUploader({ images, onChange, maxImages = 10, maxSizeMB = 10 }: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        reject(new Error(`${file.name} dépasse ${maxSizeMB}MB`))
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.includes(',') ? result.split(',')[1] : result
        resolve(base64)
      }
      reader.onerror = () => reject(new Error(`Erreur de lecture: ${file.name}`))
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (fileArray.length === 0) return
    const remaining = maxImages - images.length
    const toProcess = fileArray.slice(0, remaining)
    setProcessing(true)
    try {
      const results = await Promise.all(toProcess.map(processFile))
      onChange([...images, ...results])
    } catch (err) {
      if (err instanceof Error) alert(err.message)
    } finally {
      setProcessing(false)
    }
  }, [images, onChange, maxImages, maxSizeMB])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const moveImage = (from: number, to: number) => {
    const newImages = [...images]
    const [moved] = newImages.splice(from, 1)
    newImages.splice(to, 0, moved)
    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
            dragging ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"
          )}
        >
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
          {processing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-sm text-slate-500">Traitement des images...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">Glissez vos images ici</p>
              <p className="text-xs text-slate-400 mt-1">ou cliquez pour parcourir — {images.length}/{maxImages} images</p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP — Max {maxSizeMB}MB par image</p>
            </>
          )}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {images.map((img, index) => (
              <motion.div
                key={`${img.substring(0, 20)}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-slate-200"
              >
                <img src={`data:image/jpeg;base64,${img}`} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button type="button" onClick={() => moveImage(index, index - 1)} className="w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center text-xs cursor-pointer hover:bg-black/80">←</button>
                  )}
                  {index < images.length - 1 && (
                    <button type="button" onClick={() => moveImage(index, index + 1)} className="w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center text-xs cursor-pointer hover:bg-black/80 ml-auto">→</button>
                  )}
                </div>
                {index === 0 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-teal-700 text-white text-[10px] font-semibold">Photo principale</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          La première photo sera la photo principale. Flèches pour réorganiser.
        </p>
      )}
    </div>
  )
}
