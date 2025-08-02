"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Save, CheckCircle, XCircle } from "lucide-react"
import { fetchUserAddress, updateUserAddress } from "@/lib/api"
import type { Address } from "@/types/api"

interface AddressFormProps {
  initialAddress?: Address | null
}

export function AddressForm({ initialAddress }: AddressFormProps) {
  const [address, setAddress] = useState<Partial<Address>>(
    initialAddress || {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "USA", // Default country
      landmark: "",
      isDefault: true,
    },
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadAddress = async () => {
      if (initialAddress) {
        setAddress(initialAddress)
        setLoading(false)
        return
      }
      try {
        setError(null)
        const fetchedAddress = await fetchUserAddress()
        setAddress(fetchedAddress)
      } catch (err) {
        console.error("Failed to fetch address:", err)
        setError("Failed to load address. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    loadAddress()
  }, [initialAddress])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const updatedAddress = await updateUserAddress(address)
      setAddress(updatedAddress)
      setSuccessMessage("Address updated successfully!")
    } catch (err) {
      console.error("Failed to update address:", err)
      setError("Failed to save address. Please try again.")
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
          <CardDescription className="text-zubo-text-600 text-sm">Loading your address details...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[150px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zubo-primary-600"></div>
        </CardContent>
      </Card>
    )
  }

  if (error && !address.id) {
    return (
      <Card className="border-zubo-highlight-1-200 bg-zubo-highlight-1-50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-zubo-highlight-1-800 text-lg">
            <XCircle className="mr-2 h-5 w-5 text-zubo-highlight-1-600" />
            Error Loading Address
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
    )
  }

  return (
    <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-zubo-text-800 text-lg">
          <MapPin className="mr-2 h-5 w-5 text-zubo-primary-600" />
          Address Information
        </CardTitle>
        <CardDescription className="text-zubo-text-600 text-sm">
          Update your primary address for service bookings.
        </CardDescription>
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
            <div className="text-zubo-highlight-1-600 text-sm bg-zubo-highlight-1-50 border border-zubo-highlight-1-200 p-2 rounded">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="line1" className="text-sm font-medium text-zubo-text-700">
              Address Line 1 *
            </Label>
            <Input
              id="line1"
              name="line1"
              value={address.line1 || ""}
              onChange={handleChange}
              required
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="Street address, P.O. box, company name, c/o"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line2" className="text-sm font-medium text-zubo-text-700">
              Address Line 2
            </Label>
            <Input
              id="line2"
              name="line2"
              value={address.line2 || ""}
              onChange={handleChange}
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-zubo-text-700">
                City *
              </Label>
              <Input
                id="city"
                name="city"
                value={address.city || ""}
                onChange={handleChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-zubo-text-700">
                State / Province / Region *
              </Label>
              <Input
                id="state"
                name="state"
                value={address.state || ""}
                onChange={handleChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="State"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-sm font-medium text-zubo-text-700">
                Postal Code *
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={address.postalCode || ""}
                onChange={handleChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="Postal Code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-zubo-text-700">
                Country *
              </Label>
              <Select value={address.country || "USA"} onValueChange={(value) => handleSelectChange("country", value)}>
                <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
                  <SelectItem value="USA" className="hover:bg-zubo-background-100">
                    United States
                  </SelectItem>
                  <SelectItem value="CAN" className="hover:bg-zubo-background-100">
                    Canada
                  </SelectItem>
                  <SelectItem value="GBR" className="hover:bg-zubo-background-100">
                    United Kingdom
                  </SelectItem>
                  <SelectItem value="AUS" className="hover:bg-zubo-background-100">
                    Australia
                  </SelectItem>
                  {/* Add more countries as needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="landmark" className="text-sm font-medium text-zubo-text-700">
              Landmark / Directions
            </Label>
            <Textarea
              id="landmark"
              name="landmark"
              value={address.landmark || ""}
              onChange={handleChange}
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400 min-h-[80px]"
              placeholder="E.g., Near the park, next to the blue house"
            />
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button
            type="submit"
            disabled={saving}
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
