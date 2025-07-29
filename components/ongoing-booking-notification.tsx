"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Clock, MapPin, Phone, User, X, ChevronUp, Play, Square, Copy, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface OngoingBooking {
  id: string
  petname: string
  petType: string
  service: string
  sittername: string
  sitterphone: string
  date: string
  time: string
  duration: number
  location: string
  status: string
  amount: number
  startedat: string
  notes?: string
  startOtp?: string
  endOtp?: string
}

export function OngoingBookingNotification() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [ongoingBooking, setOngoingBooking] = useState<OngoingBooking | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchOngoingBooking()
      // Poll every 300 seconds for updates
      const interval = setInterval(fetchOngoingBooking, 300000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchOngoingBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/ongoing?ownerId=${user?.id}`)
      const data = await response.json()

      if (data.success && data.bookings && data.bookings.length > 0) {
        // Get the latest ongoing booking
        const latestBooking = data.bookings[0]
        setOngoingBooking(latestBooking)
        setIsVisible(true)
      } else {
        setOngoingBooking(null)
        setIsVisible(false)
        setIsExpanded(false)
      }
    } catch (error) {
      console.error("Error fetching ongoing booking:", error)
    } finally {
      setLoading(false)
    }
  }

  const getServiceDuration = (startedAt: string) => {
    const start = new Date(startedAt)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const handleClose = () => {
    setIsExpanded(false)
    setIsVisible(false)
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  if (loading || !isVisible || !ongoingBooking) {
    return null
  }

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Notification Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${isExpanded ? "bottom-0" : "bottom-16 md:bottom-4"
          }`}
      >
        <div className="mx-4 mb-4">
          <Card
            className={`border-l-4 border-l-green-500 shadow-lg transition-all duration-300 ${isExpanded ? "max-h-screen" : "max-h-20"
              } overflow-hidden`}
          >
            {/* Collapsed View */}
            <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleToggle}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt={ongoingBooking.petname} />
                    <AvatarFallback>{ongoingBooking.petname.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-sm truncate">{ongoingBooking.service}</p>
                      <Badge className="bg-green-100 text-green-800 text-xs">In Progress</Badge>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {ongoingBooking.petname} • {getServiceDuration(ongoingBooking.startedat)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <ChevronUp
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                      }`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClose()
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Expanded View */}
            {isExpanded && (
              <div className="border-t">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt={ongoingBooking.petname} />
                        <AvatarFallback>{ongoingBooking.petname.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{ongoingBooking.petname}</h3>
                        <p className="text-sm text-gray-600">
                          {ongoingBooking.petType} • {ongoingBooking.service}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      In Progress • {getServiceDuration(ongoingBooking.startedat)}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{ongoingBooking.sittername}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{ongoingBooking.sitterphone}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="truncate">{ongoingBooking.location}</span>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Started at</p>
                        <p className="text-sm font-medium">{ongoingBooking.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="text-lg">💰</span>
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-medium">${Number(ongoingBooking.amount).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* OTPs */}
                  {(ongoingBooking.startOtp || ongoingBooking.endOtp) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-amber-600" />
                          <span className="font-medium text-amber-800 text-sm">Service OTPs</span>
                        </div>

                        {/* START OTP */}
                        {ongoingBooking.startOtp && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Play className="h-3 w-3 text-green-600" />
                                <span className="font-medium text-green-800 text-xs">START Service</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-green-100"
                                onClick={() => copyToClipboard(ongoingBooking.startOtp!, "START OTP")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-lg font-mono font-bold text-green-900 mb-1">
                              {ongoingBooking.startOtp}
                            </div>
                            <p className="text-xs text-green-700">
                              Share this OTP with your sitter to START the service
                            </p>
                          </div>
                        )}

                        {/* END OTP */}
                        {ongoingBooking.endOtp && (
                          <div className="bg-gradient-to-r from-red-50 to-rose-50 p-3 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Square className="h-3 w-3 text-red-600" />
                                <span className="font-medium text-red-800 text-xs">END Service</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100"
                                onClick={() => copyToClipboard(ongoingBooking.endOtp!, "END OTP")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-lg font-mono font-bold text-red-900 mb-1">{ongoingBooking.endOtp}</div>
                            <p className="text-xs text-red-700">Share this OTP with your sitter to END the service</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  {ongoingBooking.notes && (
                    <>
                      <Separator />
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{ongoingBooking.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
