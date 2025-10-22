"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SERVICE_TYPES } from "@/lib/constants"
import type { ServiceType } from "@/lib/types"

interface ServiceCategoryTabsProps {
  activeTab: ServiceType
  onTabChange: (tab: ServiceType) => void
}

const serviceCategories: { type: ServiceType; description: string }[] = [
  { type: "accommodation", description: "Hotels, guest houses, serviced apartments" },
  { type: "car_hire", description: "Rental cars, drivers, pickups" },
  { type: "tour", description: "Experiences, sightseeing, guides" },
  { type: "cinema", description: "Movie tickets (vendors list shows and times)" },
  { type: "event", description: "Conferences, seminars, meetups (not venues)" },
]

export function ServiceCategoryTabs({ activeTab, onTabChange }: ServiceCategoryTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ServiceType)}>
      <TabsList className="grid grid-cols-5 w-full mb-6">
        {serviceCategories.map((category) => (
          <TabsTrigger key={category.type} value={category.type} className="text-xs sm:text-sm">
            <span className="hidden sm:inline">{SERVICE_TYPES[category.type]}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export { serviceCategories }
