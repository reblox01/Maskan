import { motion } from 'framer-motion'
import { Calculator, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function Estimate() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-3">Estimez votre bien</h1>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">
            Recevez une estimation gratuite et instantanée de la valeur de votre propriété
          </p>
        </motion.div>

        <Card className="border-0 shadow-card max-w-lg mx-auto">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Ville" />
              <Input placeholder="Type de bien" />
            </div>
            <Input placeholder="Surface (m²)" type="number" />
            <Input placeholder="Nombre de chambres" type="number" />
            <Button className="w-full bg-teal-700 hover:bg-teal-800 cursor-pointer">
              Estimer maintenant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
