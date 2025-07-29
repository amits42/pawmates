"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Search, Filter, MapPin, Clock, DollarSign, Phone, Mail, CalendarIcon, Repeat } from "lucide-react"
import { ServiceOTPDialog } from "@/components/service-otp-dialog"
import { Play, Square, Eye } from "lucide-react"

interface Booking {
  id: string
  date: string
  time: string
  service: string
  petName: string
  petType: string
  breed: string
  ownerName: string
  ownerPhone: string
  location: string
  status: string
  duration: number
  amount: number
  notes?: string
  recurring: boolean
  recurringPattern?: string
  bookingType: "regular" | "recurring_session"
  sequenceNumber?: number
  paymentStatus?: string
}

interface FormattedBooking {
  id: string
  petOwner: {
    name: string
    phone: string
    email: string
    photo?: string
  }
  pet: {
    name: string
    type: string
    breed: string
    photo?: string
  }
  service: string
  date: string
  time: string
  duration: string
  address: string
  status: string
  amount: number
  notes?: string
  bookingType: "regular" | "recurring_session"
  sequenceNumber?: number
  paymentStatus?: string
}

export default function SitterBookingsPage() {
  const { sitter, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [bookings, setBookings] = useState<FormattedBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<FormattedBooking | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [showStartOTP, setShowStartOTP] = useState(false)
  const [showEndOTP, setShowEndOTP] = useState(false)
  const [selectedBookingForOTP, setSelectedBookingForOTP] = useState<string>("")

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not scheduled"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && !sitter) {
      router.push("/login")
    }
  }, [mounted, loading, sitter, router])

  useEffect(() => {
    if (sitter) {
      fetchBookings()
    }
  }, [sitter])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)

      const userId = sitter?.userId || sitter?.id

      if (!userId) {
        console.error("No user ID available for fetching bookings")
        setBookings([])
        return
      }

      console.log("Fetching bookings for userId:", userId)

      const response = await fetch(`/api/sitters/bookings?userId=${userId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("🔍 Raw API response:", data)

      if (!Array.isArray(data)) {
        console.error("API did not return an array:", data)
        setBookings([])
        return
      }

      // Transform the API data
      const formattedBookings: FormattedBooking[] = data.map((booking: Booking) => {
        const formatted = {
          id: booking.id,
          petOwner: {
            name: booking.ownerName || "Pet Owner",
            phone: booking.ownerPhone || "N/A",
            email: `${booking.ownerName?.toLowerCase().replace(/\s/g, ".")}@example.com` || "owner@example.com",
            photo: undefined,
          },
          pet: {
            name: booking.petName || "Pet",
            type: booking.petType || "Unknown",
            breed: booking.breed || "Unknown",
            photo: undefined,
          },
          service: booking.service || "Pet Service",
          date: booking.date || "N/A",
          time: booking.time || "N/A",
          duration: `${booking.duration || 1} hr${booking.duration !== 1 ? "s" : ""}`,
          address: booking.location || "N/A",
          status: booking.status?.toUpperCase() || "ASSIGNED", // Normalize to uppercase
          amount: booking.amount || 0,
          notes: booking.notes,
          bookingType: booking.bookingType,
          sequenceNumber: booking.sequenceNumber,
          paymentStatus: booking.paymentStatus,
        }

        console.log(
          `🔍 Booking ${booking.id}: original status="${booking.status}" -> normalized status="${formatted.status}", type="${formatted.bookingType}"`,
        )
        return formatted
      })

      console.log("🔍 All formatted bookings:", formattedBookings)
      setBookings(formattedBookings)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (booking: FormattedBooking) => {
    setSelectedBooking(booking)
    setShowDetails(true)
  }

  const handleStartService = (bookingId: string) => {
    setSelectedBookingForOTP(bookingId)
    setShowStartOTP(true)
  }

  const handleEndService = (bookingId: string) => {
    setSelectedBookingForOTP(bookingId)
    setShowEndOTP(true)
  }

  const handleOTPSuccess = () => {
    fetchBookings()
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.petOwner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesTab = false

    // Map database statuses to tabs (using uppercase)
    if (activeTab === "upcoming") {
      matchesTab = ["ASSIGNED", "CONFIRMED", "PENDING", "UPCOMING"].includes(booking.status)
    } else if (activeTab === "ongoing") {
      matchesTab = ["ONGOING"].includes(booking.status)
    } else if (activeTab === "completed") {
      matchesTab = ["COMPLETED"].includes(booking.status)
    } else if (activeTab === "cancelled") {
      matchesTab = ["CANCELLED"].includes(booking.status)
    }

    console.log(
      `🔍 Booking ${booking.id}: status="${booking.status}", activeTab="${activeTab}", matchesTab=${matchesTab}`,
    )

    return matchesSearch && matchesTab
  })

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ASSIGNED":
      case "CONFIRMED":
      case "PENDING":
      case "UPCOMING":
        return (
          <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 font-medium">
            Upcoming
          </Badge>
        )
      case "ONGOING":
        return (
          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 font-medium animate-pulse">
            In Progress
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 font-medium">
            Completed
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge className="bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200 font-medium">
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 font-medium">
            {status}
          </Badge>
        )
    }
  }

  // Helper function to get action buttons
  const getActionButtons = (booking: FormattedBooking) => {
    if (booking.status === "ONGOING") {
      return (
        <div className="flex flex-col space-y-2 mt-4 w-full">
          <Button
            onClick={() => handleEndService(booking.id)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm py-2 sm:py-2"
            size="sm"
          >
            End Service
          </Button>
          <Button
            onClick={() => handleViewDetails(booking)}
            variant="outline"
            className="w-full text-xs sm:text-sm py-2 sm:py-2"
            size="sm"
          >
            View Details
          </Button>
        </div>
      )
    } else if (["ASSIGNED", "CONFIRMED", "PENDING", "UPCOMING"].includes(booking.status)) {
      return (
        <div className="flex flex-col space-y-2 mt-4 w-full">
          <Button
            onClick={() => handleStartService(booking.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-2 sm:py-2"
            size="sm"
          >
            Start Service
          </Button>
          <Button
            onClick={() => handleViewDetails(booking)}
            variant="outline"
            className="w-full text-xs sm:text-sm py-2 sm:py-2"
            size="sm"
          >
            View Details
          </Button>
        </div>
      )
    } else {
      return (
        <Button
          onClick={() => handleViewDetails(booking)}
          variant="outline"
          className="mt-4 w-full text-xs sm:text-sm py-2 sm:py-2"
          size="sm"
        >
          View Details
        </Button>
      )
    }
  }

  // Helper function to render booking card
  const renderBookingCard = (booking: FormattedBooking) => {
    const isRecurringSession = booking.bookingType === "recurring_session"

    return (
      <Card
        key={booking.id}
        className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
          booking.status === "ONGOING"
            ? "border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white"
            : "hover:border-gray-300"
        }`}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Main Content */}
          <div className="p-4 sm:p-6 flex-grow">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative">
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-white shadow-md">
                    <AvatarImage
                      src={booking.pet.photo || "/placeholder.svg?height=56&width=56"}
                      alt={booking.pet.name}
                    />
                    <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                      {booking.pet.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {booking.status === "ONGOING" && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">{booking.pet.name}</h3>
                    {isRecurringSession && (
                      <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full">
                        <Repeat className="h-3 w-3 text-purple-600" />
                        <span className="text-xs text-purple-700 font-medium">#{booking.sequenceNumber}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {booking.pet.type} • {booking.pet.breed}
                  </p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(booking.status)}
                    {booking.paymentStatus !== "PAID" && (
                      <Badge className="bg-amber-100 text-amber-800 text-xs border-amber-200">Payment Pending</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Service Info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Service</span>
                <span className="text-sm font-semibold text-gray-900">{booking.service}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 rounded-full">
                    <Calendar className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-gray-700">{formatDate(booking.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-green-100 rounded-full">
                    <Clock className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-gray-700">{booking.time}</span>
                </div>
                <div className="flex items-center space-x-2 col-span-2 sm:col-span-1">
                  <div className="p-1.5 bg-emerald-100 rounded-full">
                    <DollarSign className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="font-semibold text-emerald-700">${booking.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start space-x-2 mb-3">
              <div className="p-1.5 bg-red-100 rounded-full mt-0.5">
                <MapPin className="h-3 w-3 text-red-600" />
              </div>
              <span className="text-sm text-gray-700 line-clamp-2 flex-1">{booking.address}</span>
            </div>

            {/* Ongoing Status Alert */}
            {booking.status === "ONGOING" && (
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-green-800 font-medium">Service in progress • Use END OTP to complete</p>
                </div>
              </div>
            )}
          </div>

          {/* Owner & Actions Section */}
          <div className="bg-gradient-to-b from-gray-50 to-gray-100 border-t sm:border-t-0 sm:border-l sm:w-56 p-4">
            {/* Owner Info */}
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                <AvatarImage
                  src={booking.petOwner.photo || "/placeholder.svg?height=40&width=40"}
                  alt={booking.petOwner.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-medium">
                  {booking.petOwner.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{booking.petOwner.name}</p>
                <p className="text-xs text-gray-600">Pet Owner</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {booking.status === "ONGOING" ? (
                <>
                  <Button
                    onClick={() => handleEndService(booking.id)}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md transition-all duration-200 transform hover:scale-105"
                    size="sm"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Service
                  </Button>
                  <Button
                    onClick={() => handleViewDetails(booking)}
                    variant="outline"
                    className="w-full border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </>
              ) : ["ASSIGNED", "CONFIRMED", "PENDING", "UPCOMING"].includes(booking.status) ? (
                <>
                  <Button
                    onClick={() => handleStartService(booking.id)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md transition-all duration-200 transform hover:scale-105"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Service
                  </Button>
                  <Button
                    onClick={() => handleViewDetails(booking)}
                    variant="outline"
                    className="w-full border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleViewDetails(booking)}
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
            </div>

            {/* Duration Badge */}
            <div className="mt-3 text-center">
              <Badge variant="secondary" className="bg-white/80 text-gray-700 border border-gray-200">
                {booking.duration} duration
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const upcomingCount = bookings.filter((b) =>
    ["ASSIGNED", "CONFIRMED", "PENDING", "UPCOMING"].includes(b.status),
  ).length
  const ongoingCount = bookings.filter((b) => ["ONGOING"].includes(b.status)).length
  const completedCount = bookings.filter((b) => ["COMPLETED"].includes(b.status)).length
  const cancelledCount = bookings.filter((b) => ["CANCELLED"].includes(b.status)).length

  return (
    <div className="max-w-2xl md:max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage your pet care appointments</p>
        </div>
      </div>

      <Card className="shadow-md rounded-xl border border-gray-200">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">Booking History</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              View and manage your pet sitting appointments
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8 bg-transparent text-xs sm:text-sm">
            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
            Calendar View
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-4 mb-4">
              {/* Mobile: Vertical Tabs */}
              <div className="block sm:hidden">
                <div className="grid grid-cols-2 gap-2">
                  <TabsList className="grid grid-cols-2 h-auto bg-gray-50 p-1">
                    <TabsTrigger value="upcoming" className="text-xs py-2">
                      Upcoming
                      <span className="ml-1 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs">
                        {upcomingCount}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="ongoing" className="text-xs py-2">
                      Ongoing
                      <span className="ml-1 bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full text-xs">
                        {ongoingCount}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsList className="grid grid-cols-2 h-auto bg-gray-50 p-1">
                    <TabsTrigger value="completed" className="text-xs py-2">
                      Done
                      <span className="ml-1 bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-full text-xs">
                        {completedCount}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="text-xs py-2">
                      Cancelled
                      <span className="ml-1 bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full text-xs">
                        {cancelledCount}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Desktop: Horizontal Tabs */}
              <div className="hidden sm:flex justify-between items-center gap-2">
                <TabsList className="grid grid-cols-4 bg-gray-50">
                  <TabsTrigger value="upcoming">Upcoming ({upcomingCount})</TabsTrigger>
                  <TabsTrigger value="ongoing">Ongoing ({ongoingCount})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled ({cancelledCount})</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search bookings..."
                    className="pl-10 text-sm rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent sm:hidden">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tab Content remains the same but update action buttons for mobile */}
            <TabsContent value="upcoming" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="space-y-4">{filteredBookings.map(renderBookingCard)}</div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No upcoming bookings</h3>
                  <p className="text-gray-500">You don't have any upcoming bookings at the moment</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ongoing" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="space-y-4">{filteredBookings.map(renderBookingCard)}</div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No ongoing services</h3>
                  <p className="text-gray-500">You don't have any services in progress</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="space-y-4">{filteredBookings.map(renderBookingCard)}</div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No completed bookings</h3>
                  <p className="text-gray-500">You don't have any completed bookings yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="space-y-4">{filteredBookings.map(renderBookingCard)}</div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No cancelled bookings</h3>
                  <p className="text-gray-500">You don't have any cancelled bookings</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedBooking?.bookingType === "recurring_session" ? "Session Details" : "Booking Details"}
            </DialogTitle>
            <DialogDescription>
              Complete information about this{" "}
              {selectedBooking?.bookingType === "recurring_session" ? "session" : "booking"}
              <p>booking Id: {selectedBooking?.id}</p>
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={selectedBooking.pet.photo || "/placeholder.svg?height=48&width=48"}
                      alt={selectedBooking.pet.name}
                    />
                    <AvatarFallback>{selectedBooking.pet.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{selectedBooking.pet.name}</h3>
                      {selectedBooking.bookingType === "recurring_session" && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          Session #{selectedBooking.sequenceNumber}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedBooking.pet.type} • {selectedBooking.pet.breed}
                    </p>
                  </div>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Service</h4>
                  <p>{selectedBooking.service}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Amount</h4>
                  <p>${selectedBooking.amount.toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Date</h4>
                  <p>{selectedBooking.date}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Time</h4>
                  <p>
                    {selectedBooking.time} • {selectedBooking.duration}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                <p className="text-sm">{selectedBooking.address}</p>
              </div>

              {selectedBooking.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                  <p className="text-sm">{selectedBooking.notes}</p>
                </div>
              )}

              {selectedBooking.bookingType === "recurring_session" && selectedBooking.paymentStatus && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h4>
                  <Badge
                    className={
                      selectedBooking.paymentStatus === "PAID"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {selectedBooking.paymentStatus}
                  </Badge>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Pet Owner</h4>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedBooking.petOwner.photo || "/placeholder.svg?height=40&width=40"}
                      alt={selectedBooking.petOwner.name}
                    />
                    <AvatarFallback>{selectedBooking.petOwner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedBooking.petOwner.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{selectedBooking.petOwner.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{selectedBooking.petOwner.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button>Contact Owner</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Start OTP Dialog */}
      <ServiceOTPDialog
        open={showStartOTP}
        onOpenChange={setShowStartOTP}
        bookingId={selectedBookingForOTP}
        action="start"
        onSuccess={handleOTPSuccess}
      />

      {/* Service End OTP Dialog */}
      <ServiceOTPDialog
        open={showEndOTP}
        onOpenChange={setShowEndOTP}
        bookingId={selectedBookingForOTP}
        action="end"
        onSuccess={handleOTPSuccess}
      />
    </div>
  )
}
