import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Loader2 } from 'lucide-react'

interface AvatarCropperProps {
  imageSrc: string
  open: boolean
  onClose: () => void
  onCropComplete: (base64: string) => void
}

function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 256
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('No context')); return }

      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, size, size
      )

      const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
      resolve(base64)
    }
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = imageSrc
  })
}

export default function AvatarCropper({ imageSrc, open, onClose, onCropComplete }: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropChange = useCallback((crop: { x: number; y: number }) => setCrop(crop), [])
  const onZoomChange = useCallback((zoom: number) => setZoom(zoom), [])
  const onCropCompleteHandler = useCallback((_: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const base64 = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(base64)
      onClose()
    } catch {
      alert('Erreur lors du recadrage')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recadrer la photo</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-64 bg-slate-100 rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
            cropShape="round"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <Slider
            value={[zoom]}
            onValueChange={(v) => setZoom(v[0])}
            min={1}
            max={3}
            step={0.1}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
