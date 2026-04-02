import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Shield, Zap, ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchFilter from '@/components/SearchFilter'
import PropertyCard from '@/components/PropertyCard'
import { useFeaturedProperties } from '@/hooks/useProperties'

const trendingCities = ['Casablanca', 'Marrakech', 'Rabat', 'Tanger', 'Agadir', 'Fès', 'Meknès']

export default function Home() {
  const { properties, loading } = useFeaturedProperties()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-teal-50 to-white pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-teal-900 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Trouvez votre bien idéal{' '}
            <span className="text-teal-600">au Maroc</span>
          </motion.h1>

          <motion.p
            className="mt-4 text-base sm:text-lg text-slate-500 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Des milliers de biens immobiliers à travers tout le pays.
            Achetez, louez ou vendez en toute simplicité.
          </motion.p>

          <motion.div
            className="mt-8 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SearchFilter />
          </motion.div>

          {/* Trending */}
          <motion.div
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-xs text-slate-400 mr-1">Tendances:</span>
            {trendingCities.map((city) => (
              <Link
                key={city}
                to={`/properties?search=${city}`}
                className="px-3 py-1 text-xs font-medium text-teal-700 bg-white border border-teal-200 rounded-full hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer"
              >
                {city}
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-teal-900">
                Découvrez notre sélection de biens
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Propriétés vérifiées par nos experts
              </p>
            </div>
            <Link to="/properties">
              <Button variant="ghost" className="text-teal-700 hover:text-teal-800 cursor-pointer">
                Voir plus
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-slate-100 rounded animate-pulse w-24" />
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-32" />
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property, i) => (
                <PropertyCard key={property.id} property={property} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <p className="text-slate-500">Aucun bien en vedette pour le moment.</p>
              <Link to="/properties">
                <Button variant="outline" className="mt-4 cursor-pointer">
                  Parcourir tous les biens
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-12 bg-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-teal-900 text-center mb-10">
            Vous avez la clé d'un projet immobilier réussi !
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Simplicité',
                description: 'Une plateforme fiable et facile d\'utilisation pour vous offrir le service que vous méritez.',
              },
              {
                icon: <Search className="w-6 h-6" />,
                title: 'Rapidité',
                description: 'Nos conseillers professionnels assurent un suivi rapide de votre projet immobilier.',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Confiance',
                description: 'Votre tranquillité est notre priorité. Tous les acteurs de confiance réunis.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="text-center p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="w-12 h-12 rounded-full bg-teal-700 text-white flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-teal-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-teal-900 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            On est bien chez Maskan !
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { step: '1', title: 'Estimez votre bien', description: 'Recevez la fourchette de prix exacte correspondant à votre zone' },
              { step: '2', title: 'Publiez votre bien', description: 'Votre conseiller vous accompagne dans toutes les étapes' },
              { step: '3', title: 'Vendez votre bien', description: 'Pilotez vos visites et recevez vos offres directement' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="p-6 rounded-xl bg-white border border-slate-200 shadow-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-teal-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/estimate">
              <Button size="lg" className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
                J'estime mon bien
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/properties">
              <Button size="lg" variant="outline" className="cursor-pointer">
                Je découvre les biens
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-3">Acheter</h4>
              <ul className="space-y-2 text-sm text-teal-200">
                <li><Link to="/properties?region=Casablanca" className="hover:text-white cursor-pointer">Casablanca</Link></li>
                <li><Link to="/properties?region=Marrakech" className="hover:text-white cursor-pointer">Marrakech</Link></li>
                <li><Link to="/properties?region=Rabat" className="hover:text-white cursor-pointer">Rabat</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Types</h4>
              <ul className="space-y-2 text-sm text-teal-200">
                <li><Link to="/properties?property_type=apartment" className="hover:text-white cursor-pointer">Appartements</Link></li>
                <li><Link to="/properties?property_type=villa" className="hover:text-white cursor-pointer">Villas</Link></li>
                <li><Link to="/properties?property_type=commercial" className="hover:text-white cursor-pointer">Locaux commerciaux</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Services</h4>
              <ul className="space-y-2 text-sm text-teal-200">
                <li><Link to="/estimate" className="hover:text-white cursor-pointer">Estimation</Link></li>
                <li><Link to="/sell" className="hover:text-white cursor-pointer">Vendre</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Maskan</h4>
              <p className="text-sm text-teal-200">
                Votre partenaire de confiance pour l'immobilier au Maroc.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-teal-800 text-center text-sm text-teal-300">
            © 2026 Maskan. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
