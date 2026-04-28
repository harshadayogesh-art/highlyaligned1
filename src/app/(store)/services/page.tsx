'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useServices } from '@/hooks/use-services'
import { usePageBlockMap } from '@/components/store/page-block'
import { Button } from '@/components/ui/button'
import { Clock, ChevronRight, Star } from 'lucide-react'

export default function ServicesPage() {
  const blocks = usePageBlockMap('services')
  const { data: services, isLoading } = useServices({ activeOnly: true })

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-4">{(blocks['hero_title']?.content?.text as string) || 'Our Services'}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {(blocks['hero_subtitle']?.content?.text as string) || 'Book a personalized session to align your energy and find clarity on your path.'}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600 mx-auto" />
            <p className="mt-4 text-slate-500">Loading services...</p>
          </div>
        ) : !services?.length ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Star className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No Services Available</h3>
            <p className="text-slate-500">Check back later for new offerings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden flex flex-col group"
              >
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  {service.image_url ? (
                    <Image
                      src={service.image_url}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-white text-5xl font-bold"
                      style={{ backgroundColor: service.color_code || '#8b5cf6' }}
                    >
                      {service.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
                  <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1">
                    {service.description || 'A personalized session to help you align, heal and grow.'}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="flex items-center text-slate-600 text-sm font-medium">
                        <Clock className="h-4 w-4 mr-1 text-amber-500" />
                        {service.duration_minutes} mins
                      </span>
                      <span className="text-violet-700 font-bold text-lg mt-1">₹{service.price}</span>
                    </div>
                    <Link href={`/services/${service.slug}`}>
                      <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6">
                        Book Now <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
