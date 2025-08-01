"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Star, Heart, Shield, Users, ArrowRight, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface Booking {
  id: string
  date: string
  time: string
  status: string
  total_price: number
  service_name?: string
  pet_name?: string
  pet_type?: string
  sitter_name?: string
  notes?: string
}

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [servicesLoading, setServicesLoading] = useState(true)

  useEffect(() => {
    if (!loading && user?.isAuthenticated) {
      fetchUpcomingBooking()
      fetchServices()
    }
  }, [user, loading])

  const fetchUpcomingBooking = async () => {
    try {
      setBookingsLoading(true)
      console.log("🔍 Fetching upcoming booking...")

      // Get userId from auth context
      if (!user?.id) {
        console.log("❌ No user ID available")
        setUpcomingBooking(null)
        return
      }

      const response = await fetch(`/api/bookings/upcoming?userId=${user.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          // No upcoming booking found
          console.log("📅 No upcoming booking found")
          setUpcomingBooking(null)
          return
        }
        throw new Error("Failed to fetch upcoming booking")
      }

      const upcomingBookingData: Booking = await response.json()
      console.log("⏰ Upcoming booking:", upcomingBookingData)
      setUpcomingBooking(upcomingBookingData)
    } catch (error) {
      console.error("❌ Error fetching upcoming booking:", error)
      setUpcomingBooking(null)
    } finally {
      setBookingsLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      setServicesLoading(true)
      console.log("🔍 Fetching services...")

      const response = await fetch("/api/services")
      if (!response.ok) {
        throw new Error("Failed to fetch services")
      }

      const servicesData: Service[] = await response.json()
      console.log("🛠️ Fetched services:", servicesData)
      setServices(servicesData)
    } catch (error) {
      console.error("❌ Error fetching services:", error)
      // Fallback services if API fails
      setServices([
        { id: "1", name: "Dog Walking", description: "Professional dog walking service", price: 500, duration: 60 },
        { id: "2", name: "Pet Sitting", description: "In-home pet care and companionship", price: 800, duration: 120 },
        { id: "3", name: "Pet Grooming", description: "Complete grooming and hygiene care", price: 1200, duration: 90 },
        {
          id: "4",
          name: "Vet Visits",
          description: "Accompany your pet to veterinary appointments",
          price: 600,
          duration: 180,
        },
      ])
    } finally {
      setServicesLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zubo-background-200 via-zubo-background-50 to-zubo-background-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zubo-primary-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-zubo-text-700">Loading PetCare...</p>
        </div>
      </div>
    )
  }

  const getPetEmoji = (petType?: string) => {
    if (!petType) return "🐾"
    switch (petType.toLowerCase()) {
      case "dog":
        return "🐕"
      case "cat":
        return "🐱"
      case "bird":
        return "🐦"
      case "fish":
        return "🐠"
      case "rabbit":
        return "🐰"
      default:
        return "🐾"
    }
  }

  const getServiceEmoji = (serviceName: string) => {
    const name = serviceName.toLowerCase()
    if (name.includes("walk")) return "🚶‍♂️"
    if (name.includes("sit")) return "🏠"
    if (name.includes("groom")) return "✂️"
    if (name.includes("vet")) return "🏥"
    if (name.includes("feed")) return "🍽️"
    return "🐾"
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zubo-background-200 via-zubo-background-50 to-zubo-background-200 pb-20 md:pb-8 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-zubo-primary-50 to-zubo-highlight-1-50"></div>
        <div className="relative container mx-auto px-4 py-6 md:py-12 max-w-7xl overflow-hidden">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-zubo-primary-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-zubo-background-50 rounded-full p-4 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-12 w-12 text-zubo-primary-500"
                  >
                    <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
                    <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5" />
                    <path d="M8 14v.5" />
                    <path d="M16 14v.5" />
                    <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
                    <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306" />
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-zubo-primary-500">Welcome to PetCare! 🐾</h1>
            <p className="text-xl md:text-2xl text-zubo-text-600 mb-8 leading-relaxed">
              Your trusted companion for premium pet care services.
              <br className="hidden md:block" />
              Professional, reliable, and loving care for your furry friends.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/book-service">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-zubo-primary-500 to-zubo-highlight-1-500 hover:from-zubo-primary-600 hover:to-zubo-highlight-1-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Book a Service
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/my-bookings">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-zubo-primary-500 text-zubo-primary-500 hover:bg-zubo-primary-50 px-8 py-4 text-lg font-semibold transition-all duration-300 bg-transparent"
                >
                  View My Bookings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Upcoming Booking Section */}
        {bookingsLoading ? (
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-zubo-background-100 to-zubo-background-200">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zubo-primary-500 mx-auto mb-4"></div>
              <p className="text-zubo-primary-700">Loading your bookings...</p>
            </CardContent>
          </Card>
        ) : upcomingBooking ? (
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-zubo-accent-50 to-zubo-accent-100 overflow-hidden">
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-zubo-accent-800 flex items-center">
                    <CheckCircle className="mr-3 h-6 w-6 text-zubo-accent-600" />
                    Your Upcoming Service
                  </CardTitle>
                  <CardDescription className="text-zubo-accent-600 text-lg">Next pet care appointment</CardDescription>
                </div>
                <div className="hidden md:block">
                  <div className="bg-zubo-background-50/80 backdrop-blur-sm rounded-full p-3">
                    <Calendar className="h-8 w-8 text-zubo-accent-600" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-zubo-background-50/70 backdrop-blur-sm rounded-xl p-4 border border-zubo-accent-200">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-zubo-accent-600 mr-2" />
                    <span className="font-semibold text-zubo-accent-800">Date</span>
                  </div>
                  <p className="text-zubo-accent-700 font-medium">{formatDate(upcomingBooking.date)}</p>
                </div>
                <div className="bg-zubo-background-50/70 backdrop-blur-sm rounded-xl p-4 border border-zubo-accent-200">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-zubo-accent-600 mr-2" />
                    <span className="font-semibold text-zubo-accent-800">Time</span>
                  </div>
                  <p className="text-zubo-accent-700 font-medium">{upcomingBooking.time}</p>
                </div>
                <div className="bg-zubo-background-50/70 backdrop-blur-sm rounded-xl p-4 border border-zubo-accent-200">
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">{getPetEmoji(upcomingBooking.pet_type)}</span>
                    <span className="font-semibold text-zubo-accent-800">Pet</span>
                  </div>
                  <p className="text-zubo-accent-700 font-medium">{upcomingBooking.pet_name || "Your Pet"}</p>
                </div>
                <div className="bg-zubo-background-50/70 backdrop-blur-sm rounded-xl p-4 border border-zubo-accent-200">
                  <div className="flex items-center mb-2">
                    <Star className="h-5 w-5 text-zubo-accent-600 mr-2" />
                    <span className="font-semibold text-zubo-accent-800">Amount</span>
                  </div>
                  <p className="text-zubo-accent-700 font-medium">{formatPrice(upcomingBooking.total_price)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 bg-gradient-to-r from-zubo-primary-100 to-zubo-highlight-1-100 rounded-xl p-4 border border-zubo-primary-200">
                  <span className="font-semibold text-zubo-primary-800">Service: </span>
                  <span className="text-zubo-primary-700">{upcomingBooking.service_name || "Pet Care Service"}</span>
                </div>
                <div className="flex-1 bg-gradient-to-r from-zubo-highlight-2-100 to-zubo-highlight-1-100 rounded-xl p-4 border border-zubo-highlight-2-200">
                  <span className="font-semibold text-zubo-highlight-2-800">Caretaker: </span>
                  <span className="text-zubo-highlight-2-700">
                    {upcomingBooking.sitter_name || "Professional Caretaker"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/my-bookings">
                  <Button className="w-full sm:w-auto bg-zubo-accent-600 hover:bg-zubo-accent-700 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                    View Full Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/support?bookingId=${upcomingBooking.id}`}>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-zubo-accent-600 text-zubo-accent-600 hover:bg-zubo-accent-50 font-semibold px-6 py-3 transition-all duration-300 bg-transparent"
                  >
                    Get Help
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-zubo-background-100 to-zubo-background-200 overflow-hidden">
            <CardHeader className="relative text-center">
              <CardTitle className="text-2xl font-bold text-zubo-primary-800">
                Ready to Book Your First Service?
              </CardTitle>
              <CardDescription className="text-zubo-primary-600 text-lg">
                Give your pet the care they deserve
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-zubo-primary-700 mb-6 text-lg">
                Schedule professional pet care services with our trusted caretakers.
              </p>
              <Link href="/book-service">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-zubo-primary-500 to-zubo-highlight-1-500 hover:from-zubo-primary-600 hover:to-zubo-highlight-1-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Book Your First Service
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Services We Offer Section */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-zubo-primary-500 to-zubo-highlight-1-500 bg-clip-text text-transparent">
            Our Pet Care Services
          </h2>
          <p className="text-center text-zubo-text-600 text-lg mb-8 max-w-2xl mx-auto">
            Professional pet care services tailored to your pet's needs and your schedule.
          </p>

          {servicesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zubo-primary-500 mx-auto mb-4"></div>
              <p className="text-zubo-primary-700">Loading services...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {services.map((service, index) => (
                <Card
                  key={service.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-zubo-background-50/80 backdrop-blur-sm"
                >
                  <CardContent className="p-6 text-center">
                    <div className="bg-gradient-to-r from-zubo-primary-100 to-zubo-highlight-1-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">{getServiceEmoji(service.name)}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-zubo-text-800">{service.name}</h3>
                    <p className="text-zubo-text-600 mb-3 text-sm">{service.description}</p>
                    <div className="space-y-1">
                      <p className="text-zubo-primary-600 font-semibold">{formatPrice(service.price)}</p>
                      <p className="text-zubo-text-500 text-sm">{service.duration} minutes</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href="/book-service">
              <Button
                size="lg"
                className="bg-gradient-to-r from-zubo-primary-500 to-zubo-highlight-1-500 hover:from-zubo-primary-600 hover:to-zubo-highlight-1-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Book Any Service
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Why Choose PetCare Section */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-zubo-primary-500 to-zubo-highlight-1-500 bg-clip-text text-transparent">
            Why Choose PetCare?
          </h2>
          <p className="text-center text-zubo-text-600 text-lg mb-8 max-w-2xl mx-auto">
            We provide exceptional pet care services with the highest standards of safety and love.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Trusted Caretakers",
                description: "Verified and experienced pet care professionals",
              },
              {
                icon: Heart,
                title: "Loving Care",
                description: "Your pets receive the love and attention they deserve",
              },
              {
                icon: Clock,
                title: "24/7 Support",
                description: "Round-the-clock assistance whenever you need it",
              },
              {
                icon: Users,
                title: "Happy Community",
                description: "Join thousands of satisfied pet parents",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-zubo-background-50/80 backdrop-blur-sm"
              >
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-r from-zubo-primary-100 to-zubo-highlight-1-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-zubo-primary-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-zubo-text-800">{feature.title}</h3>
                  <p className="text-zubo-text-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
