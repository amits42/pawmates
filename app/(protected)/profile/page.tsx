"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchUserProfile, updateUserProfile, fetchUserPets } from "@/lib/api"
import PetList from "@/components/pet-list"
import { AddressForm } from "@/components/address-form"
import { User, PawPrint, MapPin, CheckCircle, Save } from "lucide-react"
import type { UserProfile, Pet } from "@/types/api"

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadPets = async () => {
    try {
      console.log("🐾 Loading pets...")
      const petsData = await fetchUserPets()
      console.log("✅ Pets loaded:", petsData)
      setPets(petsData)
    } catch (error) {
      console.error("❌ Error loading pets:", error)
    }
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setError(null)
        console.log("🔍 Loading profile...")
        const data = await fetchUserProfile()
        console.log("✅ Profile loaded:", data)
        setProfile(data)

        // Load pets separately
        await loadPets()
      } catch (error) {
        console.error("❌ Error loading profile:", error)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      console.log("📝 Updating profile with:", {
        name: profile.name,
        email: profile.email,
      })

      const updatedProfile = await updateUserProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      })

      setProfile({ ...profile, ...updatedProfile })
      setSuccessMessage("Profile updated successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("❌ Error updating profile:", error)
      setError("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return
    const { name, value } = e.target
    console.log(`🔄 Input changed: ${name} = ${value}`)
    setProfile({ ...profile, [name]: value })
  }

  const handlePetAdded = async (newPet: Pet) => {
    console.log("🐾 Pet added, refreshing pets list:", newPet)
    // Reload pets from database to ensure we have the latest data
    await loadPets()
    setSuccessMessage("Pet added successfully!")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handlePetUpdated = async (updatedPet: Pet) => {
    console.log("🐾 Pet updated, refreshing pets list:", updatedPet)
    // Reload pets from database to ensure we have the latest data
    await loadPets()
    setSuccessMessage("Pet updated successfully!")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handlePetDeleted = async (petId: string) => {
    console.log("🐾 Pet deleted, refreshing pets list:", petId)
    // Reload pets from database to ensure we have the latest data
    await loadPets()
    setSuccessMessage("Pet deleted successfully!")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const petCount = pets.length

  console.log("🔍 Profile state:", {
    hasProfile: !!profile,
    name: profile?.name,
    email: profile?.email,
    phone: profile?.phone,
    petsCount: petCount,
    hasAddress: !!profile?.address,
  })

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">Profile Settings</h1>
        <p className="text-slate-600">Manage your personal information and pets</p>
        {profile?.name && <p className="text-blue-600 font-medium">Welcome back, {profile.name}!</p>}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
          <span className="text-green-800 text-sm">{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100">
          <TabsTrigger value="personal" className="data-[state=active]:bg-white">
            <User className="h-4 w-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="pets" className="data-[state=active]:bg-white">
            <PawPrint className="h-4 w-4 mr-2" />
            Pets ({petCount})
          </TabsTrigger>
          <TabsTrigger value="address" className="data-[state=active]:bg-white">
            <MapPin className="h-4 w-4 mr-2" />
            Address
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-slate-800 text-lg">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm">Update your personal details</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileUpdate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={profile?.name || ""}
                    onChange={handleInputChange}
                    required
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile?.email || ""}
                    onChange={handleInputChange}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profile?.phone || ""}
                    disabled
                    className="border-slate-300 bg-slate-50 text-slate-500"
                    placeholder="Phone number (cannot be changed)"
                  />
                  <p className="text-xs text-slate-500">Phone number cannot be changed</p>
                </div>
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-2 rounded">{error}</div>
                )}
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  type="submit"
                  disabled={saving || !profile}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="pets">
          <PetList
            pets={pets}
            onPetAdded={handlePetAdded}
            onPetUpdated={handlePetUpdated}
            onPetDeleted={handlePetDeleted}
          />
        </TabsContent>

        <TabsContent value="address">
          <AddressForm initialAddress={profile?.address} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
