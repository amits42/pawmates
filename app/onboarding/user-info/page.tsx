"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { AlertTriangle, CheckCircle, User, Mail, MapPin, Navigation, ArrowRight } from "lucide-react"

export default function UserInfoPage() {
  const router = useRouter()
  const { user, updateUserProfile, isNewUser } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    landmark: "",
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  useEffect(() => {
    // If user is not logged in or not a new user, redirect
    if (!user) {
      router.push("/login")
      return
    }

    if (!isNewUser && user.name) {
      router.push("/")
      return
    }

    // Pre-fill form if user data exists
    if (user.name) setName(user.name)
    if (user.email) setEmail(user.email)
  }, [user, isNewUser, router])

  const handleAddressChange = (field: string, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    setError("")

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      setIsGettingLocation(false)
      return
    }

    try {
      // First check/request permission
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({ name: "geolocation" })
        console.log("📍 Geolocation permission status:", permission.state)

        if (permission.state === "denied") {
          setError("Location access is denied. Please enable location access in your browser settings and try again.")
          setIsGettingLocation(false)
          return
        }
      }

      console.log("📍 Requesting location access...")

      // Request location with high accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const accuracy = position.coords.accuracy

          console.log("📍 Got location:", { lat, lng, accuracy })

          setAddress((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }))

          setIsGettingLocation(false)
          setSuccess(
            `Location captured successfully! (${lat.toFixed(6)}, ${lng.toFixed(6)}) - Accuracy: ${Math.round(accuracy)}m`,
          )
          setTimeout(() => setSuccess(""), 5000)
        },
        (error) => {
          console.error("❌ Geolocation error:", error)
          let errorMessage = "Unable to get your location. "

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location access was denied. Please enable location access in your browser and try again."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable. Please check your internet connection."
              break
            case error.TIMEOUT:
              errorMessage += "Location request timed out. Please try again."
              break
            default:
              errorMessage += "An unknown error occurred while getting your location."
              break
          }

          setError(errorMessage)
          setIsGettingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 300000, // 5 minutes
        },
      )
    } catch (error) {
      console.error("❌ Error requesting location:", error)
      setError("Failed to request location access. Please try again.")
      setIsGettingLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      // Basic validation
      if (!name.trim()) {
        setError("Please enter your name")
        setIsLoading(false)
        return
      }

      if (!address.line1.trim() || !address.city.trim() || !address.state.trim() || !address.postalCode.trim()) {
        setError("Please fill in all required address fields")
        setIsLoading(false)
        return
      }

      if (email && !isValidEmail(email)) {
        setError("Please enter a valid email address")
        setIsLoading(false)
        return
      }

      console.log("🚀 Starting profile update process...")
      console.log("👤 Current user:", user)

      // Update profile on server
      console.log("📝 Updating user profile...")
      const profileResponse = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id, // Use the actual user ID
          name,
          email: email || undefined,
          phone: user.phone,
        }),
      })

      const profileData = await profileResponse.json()
      console.log("📥 Profile response:", profileData)

      if (!profileResponse.ok) {
        console.error("❌ Profile update failed:", profileData)
        throw new Error(profileData.message || profileData.error || "Failed to update profile")
      }

      console.log("✅ Profile updated successfully")

      // Save address
      console.log("📍 Saving address with location:", {
        latitude: address.latitude,
        longitude: address.longitude,
      })

      const addressResponse = await fetch("/api/user/address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id, // Use the actual user ID
          phone: user.phone, // Also send phone as backup
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          landmark: address.landmark,
          latitude: address.latitude,
          longitude: address.longitude,
          isDefault: true,
        }),
      })

      const addressData = await addressResponse.json()
      console.log("📥 Address response:", addressData)

      if (!addressResponse.ok) {
        console.error("❌ Address save failed:", addressData)
        throw new Error(addressData.message || addressData.error || "Failed to save address")
      }

      console.log("✅ Address saved successfully")

      // Update user profile in auth context
      await updateUserProfile({
        name,
        email: email || undefined,
      })

      setSuccess("Profile and address updated successfully!")

      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error) {
      console.error("❌ Error updating profile:", error)
      setError(error instanceof Error ? error.message : "Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">Complete Your Profile</h1>
          <p className="text-blue-600 mt-2">Tell us about yourself and where you're located</p>
        </div>

        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-800">Your Information</CardTitle>
            <CardDescription>Please provide your details and address</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-700 flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Personal Details
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-blue-700">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 border-blue-200 focus:border-blue-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-700">
                    Email Address (Optional)
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-blue-200 focus:border-blue-400"
                    />
                  </div>
                  <p className="text-xs text-gray-500">We'll use this for booking confirmations and updates</p>
                </div>
              </div>

              <Separator />

              {/* Address Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-green-700 flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Your Address
                  </h3>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="bg-green-600 hover:bg-green-700 text-white border-0"
                  >
                    {isGettingLocation ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Navigation className="mr-2 h-4 w-4" />
                    )}
                    {isGettingLocation ? "Getting Location..." : "📍 Get My Location"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="line1" className="text-green-700">
                      Address Line 1 *
                    </Label>
                    <Input
                      id="line1"
                      placeholder="123 Main Street"
                      value={address.line1}
                      onChange={(e) => handleAddressChange("line1", e.target.value)}
                      className="border-green-200 focus:border-green-400"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="line2" className="text-green-700">
                      Address Line 2 (Optional)
                    </Label>
                    <Input
                      id="line2"
                      placeholder="Apartment, suite, etc."
                      value={address.line2}
                      onChange={(e) => handleAddressChange("line2", e.target.value)}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-green-700">
                      City *
                    </Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      value={address.city}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      className="border-green-200 focus:border-green-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-green-700">
                      State *
                    </Label>
                    <Input
                      id="state"
                      placeholder="Maharashtra"
                      value={address.state}
                      onChange={(e) => handleAddressChange("state", e.target.value)}
                      className="border-green-200 focus:border-green-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-green-700">
                      Postal Code *
                    </Label>
                    <Input
                      id="postalCode"
                      placeholder="400001"
                      value={address.postalCode}
                      onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                      className="border-green-200 focus:border-green-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-green-700">
                      Country *
                    </Label>
                    <Input
                      id="country"
                      placeholder="India"
                      value={address.country}
                      onChange={(e) => handleAddressChange("country", e.target.value)}
                      className="border-green-200 focus:border-green-400"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="landmark" className="text-green-700">
                      Landmark (Optional)
                    </Label>
                    <Textarea
                      id="landmark"
                      placeholder="Near Gateway of India, opposite to Taj Hotel..."
                      value={address.landmark}
                      onChange={(e) => handleAddressChange("landmark", e.target.value)}
                      className="border-green-200 focus:border-green-400"
                      rows={2}
                    />
                  </div>
                </div>

                {address.latitude && address.longitude && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">
                      📍 Location captured: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Saving Profile & Address...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Complete Setup</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>You can update your profile and address information anytime from your account settings</p>
        </div>
      </div>
    </div>
  )
}
