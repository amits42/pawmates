"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fetchUserAddress, updateUserAddress } from "@/lib/api"
import { MapPin, Save, CheckCircle, XCircle } from "lucide-react"
import type { Address } from "@/types/api"

interface AddressFormProps {
  initialAddress?: Address | null
}

export function AddressForm({ initialAddress }: AddressFormProps) {
  const [address, setAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadAddress = async () => {
      try {
        setError(null)
        if (initialAddress) {
          setAddress(initialAddress)
        } else {
          const addressData = await fetchUserAddress()
          setAddress(addressData)
        }
      } catch (error) {
        console.error("Error loading address:", error)
        setError("Failed to load address")
        setAddress({
          id: "",
          userId: "",
          line1: "",
          line2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "USA",
          landmark: "",
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }

    loadAddress()
  }, [initialAddress])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!address) return
    const { name, value } = e.target
    setAddress({ ...address, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await updateUserAddress(address)
      setSuccessMessage("Address updated successfully!")
    } catch (error) {
      console.error("Error updating address:", error)
      setError("Failed to save address")
    } finally {
      setSaving(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  if (loading) {
    return (
      <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-zubo-text-800 text-lg">
            <MapPin className="mr-2 h-5 w-5 text-zubo-primary-600" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zubo-primary-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-zubo-text-800 text-lg">
          <MapPin className="mr-2 h-5 w-5 text-zubo-primary-600" />
          Address Information
        </CardTitle>
        <CardDescription className="text-zubo-text-600 text-sm">Update your address details</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {successMessage && (
            <div className="bg-zubo-accent-50 border border-zubo-accent-200 rounded-lg p-3 flex items-center">
              <CheckCircle className="h-4 w-4 text-zubo-accent-600 mr-2" />
              <span className="text-zubo-accent-800 text-sm">{successMessage}</span>
            </div>
          )}
          {error && (
            <div className="bg-zubo-highlight-1-50 border border-zubo-highlight-1-200 rounded-lg p-3 flex items-center">
              <XCircle className="h-4 w-4 text-zubo-highlight-1-600 mr-2" />
              <span className="text-zubo-highlight-1-800 text-sm">{error}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="line1" className="text-sm font-medium text-zubo-text-700">
              Address Line 1 *
            </Label>
            <Input
              id="line1"
              name="line1"
              value={address?.line1 || ""}
              onChange={handleInputChange}
              required
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="Street address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line2" className="text-sm font-medium text-zubo-text-700">
              Address Line 2
            </Label>
            <Input
              id="line2"
              name="line2"
              value={address?.line2 || ""}
              onChange={handleInputChange}
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="Apartment, suite, etc."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-zubo-text-700">
                City *
              </Label>
              <Input
                id="city"
                name="city"
                value={address?.city || ""}
                onChange={handleInputChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-zubo-text-700">
                State *
              </Label>
              <Input
                id="state"
                name="state"
                value={address?.state || ""}
                onChange={handleInputChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="State"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-sm font-medium text-zubo-text-700">
                Postal Code *
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={address?.postalCode || ""}
                onChange={handleInputChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="ZIP Code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-zubo-text-700">
                Country *
              </Label>
              <Input
                id="country"
                name="country"
                value={address?.country || ""}
                onChange={handleInputChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="Country"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="landmark" className="text-sm font-medium text-zubo-text-700">
              Landmark
            </Label>
            <Textarea
              id="landmark"
              name="landmark"
              value={address?.landmark || ""}
              onChange={handleInputChange}
              rows={2}
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="Nearby landmark or directions"
            />
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button
            type="submit"
            disabled={saving || !address}
            className="bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Address"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
