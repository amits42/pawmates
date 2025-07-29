"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { MessageCircle, Mail, Calendar, Clock, DollarSign, User, Upload, X } from "lucide-react"
import type { Booking } from "@/types/api"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/toaster"

interface EmailSupportFormProps {
  selectedBooking: Booking | null,
  user: any;
}

function EmailSupportForm({ selectedBooking, user }: EmailSupportFormProps) {
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      setAttachedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setAttachedImage(null)
    setImagePreview(null)
  }

  const handleEmailSubmit = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both subject and message",
        variant: "destructive",
      })
      return
    }

    if (!selectedBooking) {
      toast({
        title: "No booking selected",
        description: "Please select a booking to include in your request",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const formData = {
        subject: emailSubject,
        message: emailMessage,
        to: user?.email,
        userDetails: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone || "Not provided",
        },
        bookingDetails: {
          id: selectedBooking?.id,
          serviceName: selectedBooking?.serviceName,
          petName: selectedBooking?.petName,
          date: selectedBooking?.date,
          time: selectedBooking?.time,
          status: selectedBooking?.status,
          totalPrice: selectedBooking?.totalPrice,
        },
        imageBase64: imagePreview, // Send base64 image if attached
      }

      const response = await fetch("/api/send-support-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      toast({
        title: "Success 🎉",
        description: "Your email has been sent to support and admin.",
      })

      // Clear form
      setEmailSubject("")
      setEmailMessage("")
      removeImage()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Email Support Header */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-800">Email Support</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 text-sm">
            Send us a detailed message about your issue. All your booking details and contact info will be sent to our admin team.
          </p>
        </CardContent>
      </Card>

      {/* Email Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="email-subject" className="text-base font-medium">
            Subject *
          </Label>
          <Input
            id="email-subject"
            placeholder="Brief description of your issue"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email-message" className="text-base font-medium">
            Message *
          </Label>
          <Textarea
            id="email-message"
            placeholder="Describe your issue in detail..."
            rows={6}
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-base font-medium">Attach Image (Optional)</Label>
          <div className="mt-2">
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Attachment preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <Label
                  htmlFor="email-image-upload"
                  className="cursor-pointer text-sm text-gray-600 hover:text-gray-800"
                >
                  Click to upload an image (Max 10MB)
                </Label>
                <Input
                  id="email-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleEmailSubmit}
          disabled={isLoading || !emailSubject.trim() || !emailMessage.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending email...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Email Support Request
            </>
          )}
        </Button>
      </div>
      <Toaster />
    </div>
  )
}

export default function SupportPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [contactMethod, setContactMethod] = useState<"chat" | "email">("chat")

  const searchParams = useSearchParams()
  const bookingId = searchParams?.get("bookingId")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user?.id) {
      fetchBookings()
    }
  }, [user])

  useEffect(() => {
    if (bookingId && bookings.length > 0) {
      const booking = bookings.find((b) => b.id.toString() === bookingId)
      if (booking) {
        setSelectedBooking(booking)
      }
    }
  }, [bookingId, bookings])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/bookings", {
        headers: {
          "Content-Type": "application/json",
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch bookings")
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        setBookings(data)
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppChat = async () => {
    setIsLoading(true)

    try {
      if (!selectedBooking) {
        toast({
          title: "No booking selected",
          description: "Please select a booking to get help with.",
          variant: "destructive",
        })
        return
      }

      // Create WhatsApp message with booking details
      const message = `Hi! I need help with my booking:

📋 *Booking Details:*
• Booking ID: #${selectedBooking.id}
• Service: ${selectedBooking.serviceName || "Pet Care Service"}
• Pet: ${selectedBooking.petName || "My Pet"}
• Date: ${selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString() : "Not specified"}
• Time: ${selectedBooking.time || "Not specified"}
• Status: ${selectedBooking.status || "Unknown"}
• Amount: ₹${selectedBooking.totalPrice || "Not specified"}

Please assist me with this booking. Thank you!`

      // Get admin WhatsApp number from environment
      const adminWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN_SUPPORT || "918892743780"

      // Create WhatsApp URL with pre-filled message
      const whatsappUrl = `https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent(message)}`

      // Open WhatsApp directly
      window.open(whatsappUrl, "_blank")

      toast({
        title: "Opening WhatsApp! 📱",
        description: "You'll be redirected to WhatsApp with your booking details pre-filled.",
      })
    } catch (error) {
      console.error("Error opening WhatsApp:", error)
      toast({
        title: "Failed to open WhatsApp",
        description: "Please try again or contact support directly.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      confirmed: { variant: "default" as const, color: "bg-green-100 text-green-800" },
      pending: { variant: "outline" as const, color: "bg-yellow-100 text-yellow-800" },
      ongoing: { variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      completed: { variant: "outline" as const, color: "bg-green-100 text-green-800" },
      cancelled: { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      assigned: { variant: "default" as const, color: "bg-purple-100 text-purple-800" },
    }

    const normalizedStatus = status?.toLowerCase() || "pending"
    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant={config.variant} className={config.color}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"}
      </Badge>
    )
  }

  const categorizeBookings = () => {
    const normalizeStatus = (status: string) => status?.toUpperCase() || "PENDING"

    return {
      upcoming: bookings.filter((booking) => {
        const status = normalizeStatus(booking.status)
        return ["ASSIGNED", "CONFIRMED", "PENDING", "UPCOMING"].includes(status)
      }),
      ongoing: bookings.filter((booking) => {
        const status = normalizeStatus(booking.status)
        return status === "ONGOING"
      }),
      completed: bookings.filter((booking) => {
        const status = normalizeStatus(booking.status)
        return status === "COMPLETED"
      }),
      cancelled: bookings.filter((booking) => {
        const status = normalizeStatus(booking.status)
        return status === "CANCELLED"
      }),
    }
  }

  const { upcoming, ongoing, completed, cancelled } = categorizeBookings()

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading support options...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Select a Booking */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold">Select a Booking</h2>
          </div>
          <p className="text-gray-600 mb-6">Choose the booking you need help with</p>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing ({ongoing.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4 mt-4">
              {upcoming.length > 0 ? (
                upcoming.map((booking) => (
                  <Card
                    key={booking.id}
                    className={`cursor-pointer transition-all ${selectedBooking?.id === booking.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                      }`}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 text-sm">🐾</span>
                          </div>
                          <div>
                            <h3 className="font-medium">
                              #{booking.id.toString().slice(-12)} - {booking.serviceName || "Service"}
                            </h3>
                            <p className="text-sm text-gray-600">Pet ({booking.petName || "Unknown"})</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status || "pending")}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {booking.date ? new Date(booking.date).toLocaleDateString() : "Not scheduled"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {booking.time || "08:00"}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />₹{booking.totalPrice?.toFixed(2) || "0.00"}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Caretaker
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No upcoming bookings found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ongoing" className="space-y-4 mt-4">
              {ongoing.length > 0 ? (
                ongoing.map((booking) => (
                  <Card
                    key={booking.id}
                    className={`cursor-pointer transition-all ${selectedBooking?.id === booking.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                      }`}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm">🔄</span>
                          </div>
                          <div>
                            <h3 className="font-medium">
                              #{booking.id.toString().slice(-12)} - {booking.serviceName || "Service"}
                            </h3>
                            <p className="text-sm text-gray-600">Pet ({booking.petName || "Unknown"})</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status || "pending")}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {booking.date ? new Date(booking.date).toLocaleDateString() : "Not scheduled"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {booking.time || "08:00"}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />₹{booking.totalPrice?.toFixed(2) || "0.00"}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Caretaker
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No ongoing bookings found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-4">
              {completed.length > 0 ? (
                completed.map((booking) => (
                  <Card
                    key={booking.id}
                    className={`cursor-pointer transition-all ${selectedBooking?.id === booking.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                      }`}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm">✅</span>
                          </div>
                          <div>
                            <h3 className="font-medium">
                              #{booking.id.toString().slice(-12)} - {booking.serviceName || "Service"}
                            </h3>
                            <p className="text-sm text-gray-600">Pet ({booking.petName || "Unknown"})</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status || "pending")}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {booking.date ? new Date(booking.date).toLocaleDateString() : "Not scheduled"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {booking.time || "08:00"}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />₹{booking.totalPrice?.toFixed(2) || "0.00"}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Caretaker
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No completed bookings found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4 mt-4">
              {cancelled.length > 0 ? (
                cancelled.map((booking) => (
                  <Card
                    key={booking.id}
                    className={`cursor-pointer transition-all ${selectedBooking?.id === booking.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                      }`}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-sm">❌</span>
                          </div>
                          <div>
                            <h3 className="font-medium">
                              #{booking.id.toString().slice(-12)} - {booking.serviceName || "Service"}
                            </h3>
                            <p className="text-sm text-gray-600">Pet ({booking.petName || "Unknown"})</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status || "pending")}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {booking.date ? new Date(booking.date).toLocaleDateString() : "Not scheduled"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {booking.time || "08:00"}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />₹{booking.totalPrice?.toFixed(2) || "0.00"}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Caretaker
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No cancelled bookings found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side - Contact Support */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold">Contact Support</h2>
          </div>
          <p className="text-gray-600 mb-6">Choose how you'd like to get help</p>

          {/* Selected Booking Display */}
          {selectedBooking && (
            <Card className="mb-6 bg-orange-50 border-orange-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">🐾</span>
                  <CardTitle className="text-lg">Selected Booking</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> #{selectedBooking.id.toString().slice(-12)}
                  </div>
                  <div>
                    <span className="font-medium">Service:</span> {selectedBooking.serviceName || "Service"}
                  </div>
                  <div>
                    <span className="font-medium">Pet:</span> {selectedBooking.petName || "Pet"}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{" "}
                    {selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString() : "Not scheduled"}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                      {selectedBooking.status?.toUpperCase() || "PENDING"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> ₹{selectedBooking.totalPrice?.toFixed(2) || "0.00"}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Method Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Choose contact method:</h3>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={contactMethod === "chat" ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-center gap-2 ${contactMethod === "chat"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "border-green-200 hover:bg-green-50"
                  }`}
                disabled={!selectedBooking}
                onClick={() => setContactMethod("chat")}
              >
                <MessageCircle className={`w-6 h-6 ${contactMethod === "chat" ? "text-white" : "text-green-600"}`} />
                <span className={`font-medium ${contactMethod === "chat" ? "text-white" : "text-green-600"}`}>
                  Chat
                </span>
              </Button>

              <Button
                variant={contactMethod === "email" ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-center gap-2 ${contactMethod === "email"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border-blue-200 hover:bg-blue-50"
                  }`}
                disabled={!selectedBooking}
                onClick={() => setContactMethod("email")}
              >
                <Mail className={`w-6 h-6 ${contactMethod === "email" ? "text-white" : "text-blue-600"}`} />
                <span className={`font-medium ${contactMethod === "email" ? "text-white" : "text-blue-600"}`}>
                  Email
                </span>
              </Button>
            </div>

            {/* Chat Support Section */}
            {contactMethod === "chat" && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-lg text-green-800">WhatsApp Admin Support</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-green-700 text-sm mb-4">
                    Start a WhatsApp chat session with our admin support team. We'll create a dedicated chat room for
                    your booking where you can get instant help and support.
                  </p>

                  <Button
                    onClick={handleWhatsAppChat}
                    disabled={!selectedBooking || isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Starting chat...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Start WhatsApp Chat Session
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Email Support Section */}
            {contactMethod === "email" && <EmailSupportForm user={user} selectedBooking={selectedBooking} />}
          </div>
        </div>
      </div>
    </div>
  )
}
