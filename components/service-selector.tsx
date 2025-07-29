"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Service } from "@/types/api"

interface ServiceSelectorProps {
  services: Service[]
  selectedServiceId: string | null
  onSelectService: (id: string) => void
}

export function ServiceSelector({ services, selectedServiceId, onSelectService }: ServiceSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {services.map((service) => (
        <Card
          key={service.id}
          className={`cursor-pointer transition-all ${selectedServiceId === service.id ? "ring-2 ring-primary" : ""}`}
          onClick={() => onSelectService(service.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <Badge variant="outline" className="text-green-700 border-green-300">
                ₹{service.price}
              </Badge>
            </div>
            <CardDescription>{service.duration} mins</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{service.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
