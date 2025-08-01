"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { Calendar, Clock, Repeat, User, Heart, Info, AlertTriangle } from "lucide-react"
import { PetSelector } from "@/components/pet-selector"
import { ServiceSelector } from "@/components/service-selector"
import { TimeSelector } from "@/components/time-selector"
import { RecurringOptions } from "@/components/recurring-options"
import type { Pet, Service } from "@/types/api"
import { fetchUserPets, fetchServices } from "@/lib/api"

export default function BookServicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pets, setPets] = useState<Pet[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedPet, setSelectedPet] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringPattern, setRecurringPattern] = useState<string | null>(null)
  const [recurringEndDate, setRecurringEndDate] = useState<string>("")

  // UI state
  const [bookingType, setBookingType] = useState<"one-time" | "recurring">("one-time")

  // Check if this is a rebook
  const isRebook = searchParams?.get("rebook") === "true"
  const originalBookingId = searchParams?.get("originalBookingId")

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("📋 Loading initial data for booking...")
        const [petsData, servicesData] = await Promise.all([fetchUserPets(), fetchServices()])

        console.log("✅ Data loaded:", { pets: petsData, services: servicesData })
        setPets(petsData)
        setServices(servicesData)

        // Pre-fill form if this is a rebook
        if (isRebook && searchParams) {
          const petId = searchParams.get("pet")
          const serviceId = searchParams.get("service")
          const time = searchParams.get("time")
          const recurring = searchParams.get("recurring") === "true"
          const pattern = searchParams.get("pattern")

          if (petId) setSelectedPet(petId)
          if (serviceId) setSelectedService(serviceId)
          if (time) setSelectedTime(time)
          if (recurring) {
            setBookingType("recurring")
            setIsRecurring(true)
            if (pattern) setRecurringPattern(pattern)
          }
        }
      } catch (error) {
        console.error("❌ Error loading initial data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  const handlePetsUpdate = (updatedPets: Pet[]) => {
    console.log("🔄 Updating pets list:", updatedPets)
    setPets(updatedPets)
  }

  const calculateRecurringSessions = () => {
    if (bookingType !== "recurring" || !recurringPattern || !selectedDate || !recurringEndDate) {
      return 0
    }

    const startDate = new Date(selectedDate)
    const endDate = new Date(recurringEndDate)

    if (endDate <= startDate) return 0

    const daysOfWeekMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }

    let sessionCount = 0

    if (recurringPattern.startsWith("weekly_")) {
      const [, intervalStr, daysStr] = recurringPattern.split("_")
      const weekInterval = Number.parseInt(intervalStr, 10)
      const days = daysStr.split(",").map((d) => daysOfWeekMap[d.toLowerCase()])

      const current = new Date(startDate)

      while (current <= endDate) {
        if (days.includes(current.getDay())) {
          sessionCount++
        }

        // Move to next day
        current.setDate(current.getDate() + 1)

        // If we pass a week, skip forward by (interval - 1) weeks
        const daysSinceStart = Math.floor((current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceStart % (weekInterval * 7) === 0) {
          // already aligned by day increment
        }
      }
    } else if (recurringPattern.startsWith("monthly_")) {
      const [, intervalStr, nthStr, daysStr] = recurringPattern.split("_")
      const monthInterval = Number.parseInt(intervalStr, 10)
      const nth = Number.parseInt(nthStr, 10)
      const weekdays = daysStr.split(",").map((d) => daysOfWeekMap[d.toLowerCase()])

      const current = new Date(startDate)

      while (current <= endDate) {
        const year = current.getFullYear()
        const month = current.getMonth()

        for (const weekday of weekdays) {
          const date = getNthWeekdayOfMonth(year, month, weekday, nth)
          if (date && date >= startDate && date <= endDate) {
            sessionCount++
          }
        }

        // Move to next interval month
        current.setMonth(current.getMonth() + monthInterval)
        current.setDate(1) // reset to start of month
      }
    }

    return sessionCount
  }

  // Utility: Get Nth weekday in a month (e.g., 3rd Tuesday of June 2025)
  function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
    const firstDay = new Date(year, month, 1)
    const firstDayOfWeek = firstDay.getDay()
    const offset = (7 + weekday - firstDayOfWeek) % 7
    const date = 1 + offset + (nth - 1) * 7
    const result = new Date(year, month, date)
    return result.getMonth() === month ? result : null
  }

  const getRecurringSessionsInfo = () => {
    const sessions = calculateRecurringSessions()
    const selectedServiceData = services.find((s) => s.id === selectedService)
    const servicePrice = selectedServiceData?.price || 0
    const totalPrice = sessions * servicePrice

    return {
      sessions,
      servicePrice,
      totalPrice,
    }
  }

  const handleSubmit = () => {
    const params = new URLSearchParams({
      pet: selectedPet || "",
      service: selectedService || "",
      date: selectedDate,
      time: selectedTime || "",
      recurring: (bookingType === "recurring").toString(),
    })

    if (bookingType === "recurring") {
      params.append("pattern", recurringPattern || "")
      params.append("endDate", recurringEndDate)

      // Add session and pricing info for recurring bookings
      const { sessions, totalPrice } = getRecurringSessionsInfo()
      params.append("sessions", sessions.toString())
      params.append("totalPrice", totalPrice.toString())
    }

    if (isRebook && originalBookingId) {
      params.append("rebook", "true")
      params.append("originalBookingId", originalBookingId)
    }

    router.push(`/book-service/payment?${params.toString()}`)
  }

  const isFormValid = () => {
    const basicValid = selectedPet && selectedService && selectedDate && selectedTime

    if (bookingType === "recurring") {
      return basicValid && recurringPattern && recurringEndDate
    }

    return basicValid
  }

  const getSelectedPetName = () => {
    const pet = pets.find((p) => p.id === selectedPet)
    return pet?.name || ""
  }

  const getSelectedServiceName = () => {
    const service = services.find((s) => s.id === selectedService)
    return service?.name || ""
  }

  const formatRecurringText = () => {
    if (bookingType !== "recurring" || !recurringPattern) return ""

    // Handle new detailed patterns
    if (recurringPattern.startsWith("daily_")) {
      const day = recurringPattern.split("_")[1]
      return `Every ${day.charAt(0).toUpperCase() + day.slice(1)}`
    }

    if (recurringPattern.startsWith("weekly_")) {
      const [, interval, day] = recurringPattern.split("_")
      const intervalText = interval === "1" ? "" : `${interval} weeks`
      return `Every ${intervalText ? intervalText + " on" : ""} ${day.charAt(0).toUpperCase() + day.slice(1)}`
    }

    if (recurringPattern.startsWith("monthly_")) {
      const [, interval, week, day] = recurringPattern.split("_")
      const weekLabels = { "1": "1st", "2": "2nd", "3": "3rd", "4": "4th", last: "Last" }
      const weekLabel = weekLabels[week as keyof typeof weekLabels] || week
      const intervalText = interval === "1" ? "month" : `${interval} months`
      return `Every ${intervalText} on the ${weekLabel} ${day.charAt(0).toUpperCase() + day.slice(1)}`
    }

    // Fallback for old patterns
    const patterns: Record<string, string> = {
      daily: "Every day",
      weekdays: "Monday to Friday",
      weekly: "Every week",
      biweekly: "Every 2 weeks",
      monthly: "Every month",
    }

    return patterns[recurringPattern] || recurringPattern
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading booking options...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Error loading booking page:</strong> {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-zubo-text-neutral-800">
          {isRebook ? "Rebook Service" : "Book a Service"}
        </h1>
        <p className="text-zubo-text-neutral-600">
          {isRebook
            ? "Your previous booking details have been loaded. Please select a new date and time."
            : "Schedule care for your pet - our admin will assign the best caretaker for you"}
        </p>
      </div>

      {/* Rebook Alert */}
      {isRebook && (
        <Alert className="border-zubo-accent-200 bg-zubo-accent-50">
          <Repeat className="h-4 w-4" />
          <AlertDescription className="text-zubo-accent-800">
            <strong>Rebooking in progress!</strong> Your previous service details have been pre-filled. Just select a
            new date and time to continue.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Summary */}
      {(selectedPet || selectedService || selectedDate || selectedTime) && (
        <Card className="border-zubo-primary-200 bg-zubo-primary-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-zubo-primary-600" />
              <span className="font-medium text-zubo-primary-900">Booking Summary</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {selectedPet && (
                <div className="flex items-center gap-2">
                  <Heart className="h-3 w-3 text-zubo-primary-600" />
                  <span>Pet: {getSelectedPetName()}</span>
                </div>
              )}
              {selectedService && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-zubo-primary-600" />
                  <span>Service: {getSelectedServiceName()}</span>
                </div>
              )}
              {selectedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-zubo-primary-600" />
                  <span>Date: {format(new Date(selectedDate), "MMM dd, yyyy")}</span>
                </div>
              )}
              {selectedTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-zubo-primary-600" />
                  <span>Time: {selectedTime}</span>
                </div>
              )}
              {bookingType === "recurring" && recurringPattern && (
                <>
                  <div className="flex items-center gap-2">
                    <Repeat className="h-3 w-3 text-zubo-primary-600" />
                    <span>{formatRecurringText()}</span>
                  </div>
                  {(() => {
                    const { sessions, servicePrice, totalPrice } = getRecurringSessionsInfo()
                    return sessions > 0 ? (
                      <div className="col-span-2 p-3 bg-zubo-primary-100 rounded-lg border border-zubo-primary-200">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">Sessions:</span>
                            <span className="font-bold text-zubo-primary-800">{sessions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Per Session:</span>
                            <span>₹{servicePrice}</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-zubo-primary-200">
                          <div className="flex justify-between font-bold text-zubo-primary-900">
                            <span>Total Amount:</span>
                            <span>₹{totalPrice}</span>
                          </div>
                        </div>
                      </div>
                    ) : null
                  })()}
                </>
              )}
            </div>
            <div className="mt-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
              💡 A caretaker will be assigned by our admin team after booking confirmation
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Step 1: Select Pet */}
        <Card className="border-zubo-text-neutral-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-zubo-text-neutral-800 text-lg">
              <Heart className="h-5 w-5 text-zubo-primary-600" />
              1. Select Your Pet
            </CardTitle>
            <CardDescription className="text-zubo-text-neutral-600 text-sm">
              Choose which pet needs care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PetSelector
              pets={pets}
              selectedPetId={selectedPet}
              onSelectPet={setSelectedPet}
              onPetsUpdate={handlePetsUpdate}
            />
          </CardContent>
        </Card>

        {/* Step 2: Select Service */}
        <Card className="border-zubo-text-neutral-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-zubo-text-neutral-800 text-lg">
              <User className="h-5 w-5 text-zubo-primary-600" />
              2. Choose Service Type
            </CardTitle>
            <CardDescription className="text-zubo-text-neutral-600 text-sm">
              What kind of care do you need?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceSelector
              services={services}
              selectedServiceId={selectedService}
              onSelectService={setSelectedService}
            />
          </CardContent>
        </Card>

        {/* Step 3: Schedule */}
        <Card className="border-zubo-text-neutral-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-zubo-text-neutral-800 text-lg">
              <Calendar className="h-5 w-5 text-zubo-primary-600" />
              3. Schedule Your Service
            </CardTitle>
            <CardDescription className="text-zubo-text-neutral-600 text-sm">
              When do you need the service?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Type Tabs */}
            <Tabs value={bookingType} onValueChange={(value) => setBookingType(value as "one-time" | "recurring")}>
              <TabsList className="grid w-full grid-cols-2 bg-zubo-background-100">
                <TabsTrigger value="one-time" className="flex items-center gap-2 data-[state=active]:bg-white">
                  <Calendar className="h-4 w-4" />
                  One-time
                </TabsTrigger>
                <TabsTrigger value="recurring" className="flex items-center gap-2 data-[state=active]:bg-white">
                  <Repeat className="h-4 w-4" />
                  Recurring
                </TabsTrigger>
              </TabsList>

              <TabsContent value="one-time" className="space-y-4 mt-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-blue-800">
                    Schedule a single service appointment for your pet.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                      Select Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <TimeSelector selectedTime={selectedTime} onSelectTime={setSelectedTime} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recurring" className="space-y-4 mt-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-blue-800">
                    Set up regular appointments for ongoing pet care.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-sm font-medium text-slate-700">
                        Start Date
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-sm font-medium text-slate-700">
                        End Date
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={recurringEndDate}
                        onChange={(e) => setRecurringEndDate(e.target.value)}
                        min={selectedDate || new Date().toISOString().split("T")[0]}
                        className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <TimeSelector selectedTime={selectedTime} onSelectTime={setSelectedTime} />
                  </div>

                  <RecurringOptions
                    selectedPattern={recurringPattern}
                    onSelectPattern={setRecurringPattern}
                    endDate={recurringEndDate ? new Date(recurringEndDate) : undefined}
                    onSelectEndDate={(date) => setRecurringEndDate(date ? date.toISOString().split("T")[0] : "")}
                  />

                  {/* Session Summary for Recurring Bookings */}
                  {bookingType === "recurring" &&
                    selectedService &&
                    selectedDate &&
                    recurringEndDate &&
                    recurringPattern && (
                      <Card className="border-zubo-accent-200 bg-zubo-accent-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Repeat className="h-4 w-4 text-zubo-accent-600" />
                            <span className="font-semibold text-zubo-accent-900">Recurring Booking Summary</span>
                          </div>

                          {(() => {
                            const { sessions, servicePrice, totalPrice } = getRecurringSessionsInfo()
                            const selectedServiceData = services.find((s) => s.id === selectedService)

                            return sessions > 0 ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-zubo-accent-800">Service:</span>
                                      <span className="font-medium">{selectedServiceData?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zubo-accent-800">Pattern:</span>
                                      <span className="font-medium">{formatRecurringText()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zubo-accent-800">Duration:</span>
                                      <span className="font-medium">
                                        {format(new Date(selectedDate), "MMM dd")} -{" "}
                                        {format(new Date(recurringEndDate), "MMM dd, yyyy")}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-zubo-accent-800">Total Sessions:</span>
                                      <span className="font-bold text-lg text-zubo-accent-800">{sessions}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zubo-accent-800">Price per Session:</span>
                                      <span className="font-medium">₹{servicePrice}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-zubo-accent-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-zubo-accent-900">Total Amount:</span>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-zubo-accent-800">₹{totalPrice}</div>
                                      <div className="text-xs text-zubo-accent-600">
                                        {sessions} sessions × ₹{servicePrice}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <Alert className="border-zubo-accent-200 bg-zubo-accent-100">
                                  <Info className="h-4 w-4" />
                                  <AlertDescription className="text-zubo-accent-800">
                                    <strong>Payment:</strong> Full amount (₹{totalPrice}) will be charged upfront for
                                    all {sessions} sessions.
                                  </AlertDescription>
                                </Alert>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-zubo-accent-800">
                                  Please select all recurring options to see session calculation
                                </p>
                              </div>
                            )
                          })()}
                        </CardContent>
                      </Card>
                    )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="sticky bottom-4 bg-white p-4 border border-zubo-text-neutral-200 rounded-lg shadow-lg">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid()}
            className="w-full h-12 text-lg font-medium bg-zubo-primary hover:bg-zubo-primary-700"
          >
            {isFormValid() ? "Proceed to Payment" : "Complete all steps to continue"}
          </Button>

          {isFormValid() && (
            <p className="text-center text-sm text-zubo-text-neutral-500 mt-2">
              Review your booking details and proceed to payment
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
