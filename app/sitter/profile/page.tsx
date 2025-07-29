"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Camera, User, MapPin, Phone, Mail, Briefcase, Heart } from "lucide-react"

export default function SitterProfilePage() {
  const { sitter, updateSitterProfile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    experience: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    services: [] as string[],
  })

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
      setFormData({
        name: sitter.name || "",
        email: sitter.email || "",
        phone: sitter.phone || "",
        bio: sitter.bio || "",
        experience: sitter.experience || "",
        address: {
          street: sitter.address?.street || "",
          city: sitter.address?.city || "",
          state: sitter.address?.state || "",
          zipCode: sitter.address?.zipCode || "",
        },
        services: sitter.services || [],
      })
    }
  }, [sitter])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => {
      const services = [...prev.services]
      if (services.includes(service)) {
        return { ...prev, services: services.filter((s) => s !== service) }
      } else {
        return { ...prev, services: [...services, service] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // In a real app, we would make an API call here
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      // Update the sitter profile
      await updateSitterProfile(formData)

      setSuccess("Profile updated successfully!")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted || loading || !sitter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const availableServices = [
    "Dog Walking",
    "Pet Sitting",
    "Boarding",
    "Daycare",
    "Grooming",
    "Training",
    "Pet Taxi",
    "Medication Administration",
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your sitter profile information</p>
        </div>
        <Badge variant={sitter.isVerified ? "default" : "secondary"} className="bg-green-100 text-green-800">
          {sitter.isVerified ? "✓ Verified" : "Pending Verification"}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Personal Info</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>Services</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={sitter.photo || "/placeholder.svg"} alt={sitter.name} />
                    <AvatarFallback className="text-2xl">{sitter.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline" size="sm" className="flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="e.g. 3 years"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell pet owners about yourself..."
                    className="min-h-[120px]"
                  />
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                    <h3 className="text-lg font-medium">Address</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.street">Street Address</Label>
                      <Input
                        id="address.street"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address.city">City</Label>
                      <Input
                        id="address.city"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address.state">State</Label>
                      <Input
                        id="address.state"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address.zipCode">ZIP Code</Label>
                      <Input
                        id="address.zipCode"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} className="ml-auto">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>Select the services you provide as a pet sitter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableServices.map((service) => (
                  <div
                    key={service}
                    onClick={() => handleServiceToggle(service)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.services.includes(service)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{service}</span>
                      {formData.services.includes(service) && <CheckCircle className="h-5 w-5 text-green-600" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit} disabled={isLoading} className="ml-auto">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Services"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
