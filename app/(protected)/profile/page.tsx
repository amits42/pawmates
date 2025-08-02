"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, MapPin, PawPrint, Save, CheckCircle, XCircle } from "lucide-react"
import { fetchUserProfile, updateUserProfile } from "@/lib/api"
import type { UserProfile } from "@/types/api"
import { PetList } from "@/components/pet-list"
import { AddressForm } from "@/components/address-form"

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setError(null)
        const userProfile = await fetchUserProfile()
        setProfile(userProfile)
      } catch (error) {
        console.error("Error loading profile:", error)
        setError("Failed to load profile. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return
    const { name, value } = e.target
    setProfile({ ...profile, [name]: value })
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await updateUserProfile(profile)
      setSuccessMessage("Profile updated successfully!")
    } catch (error) {
      console.error("Error saving profile:", error)
      setError("Failed to save profile. Please try again.")
    } finally {
      setSaving(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] bg-zubo-background-100 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zubo-primary-600"></div>
        <p className="mt-4 text-zubo-text-600">Loading profile...</p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] bg-zubo-background-100 p-4">
        <Card className="w-full max-w-md border-zubo-highlight-1-200 bg-zubo-highlight-1-50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-zubo-highlight-1-800 text-lg">
              <XCircle className="mr-2 h-5 w-5 text-zubo-highlight-1-600" />
              Error Loading Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-zubo-highlight-1-600">
            <p>{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 border-zubo-primary-500 text-zubo-primary-700 hover:bg-zubo-primary-50 bg-transparent"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-100px)] bg-zubo-background-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zubo-text-800">My Profile</h1>
            <p className="text-zubo-text-600">Manage your personal information, pets, and address.</p>
            {profile && <p className="text-zubo-primary-600 mt-1">Welcome, {profile.firstName || "User"}!</p>}
          </div>
        </div>

        {successMessage && (
          <div className="bg-zubo-accent-50 border border-zubo-accent-200 rounded-lg p-3 flex items-center">
            <CheckCircle className="h-4 w-4 text-zubo-accent-600 mr-2" />
            <span className="text-zubo-accent-800 text-sm">{successMessage}</span>
          </div>
        )}

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zubo-background-100">
            <TabsTrigger
              value="personal"
              className="data-[state=active]:bg-zubo-background-50 data-[state=active]:text-zubo-primary-700 text-zubo-text-600 hover:text-zubo-primary-700"
            >
              <User className="mr-2 h-4 w-4" /> Personal Info
            </TabsTrigger>
            <TabsTrigger
              value="pets"
              className="data-[state=active]:bg-zubo-background-50 data-[state=active]:text-zubo-primary-700 text-zubo-text-600 hover:text-zubo-primary-700"
            >
              <PawPrint className="mr-2 h-4 w-4" /> My Pets
            </TabsTrigger>
            <TabsTrigger
              value="address"
              className="data-[state=active]:bg-zubo-background-50 data-[state=active]:text-zubo-primary-700 text-zubo-text-600 hover:text-zubo-primary-700"
            >
              <MapPin className="mr-2 h-4 w-4" /> Address
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-6">
            <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-zubo-text-800 text-lg">
                  <User className="mr-2 h-5 w-5 text-zubo-primary-600" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-zubo-text-600 text-sm">Update your personal details</CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveProfile}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-zubo-text-700">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={profile?.firstName || ""}
                        onChange={handleProfileChange}
                        required
                        className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-zubo-text-700">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={profile?.lastName || ""}
                        onChange={handleProfileChange}
                        required
                        className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-zubo-text-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="border-zubo-background-300 bg-zubo-background-200 text-zubo-text-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-zubo-text-500">Email cannot be changed.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-zubo-text-700">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={profile?.phone || ""}
                      disabled
                      className="border-zubo-background-300 bg-zubo-background-200 text-zubo-text-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-zubo-text-500">Phone number cannot be changed.</p>
                  </div>
                </CardContent>
                <CardContent className="pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="pets" className="mt-6">
            <PetList
              pets={profile?.pets || []}
              onPetAdded={(newPet) => setProfile((prev) => (prev ? { ...prev, pets: [...prev.pets, newPet] } : null))}
              onPetUpdated={(updatedPet) =>
                setProfile((prev) =>
                  prev ? { ...prev, pets: prev.pets.map((p) => (p.id === updatedPet.id ? updatedPet : p)) } : null,
                )
              }
              onPetDeleted={(deletedPetId) =>
                setProfile((prev) => (prev ? { ...prev, pets: prev.pets.filter((p) => p.id !== deletedPetId) } : null))
              }
            />
          </TabsContent>

          <TabsContent value="address" className="mt-6">
            <AddressForm initialAddress={profile?.address} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
