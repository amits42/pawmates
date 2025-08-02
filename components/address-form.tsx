"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Save, CheckCircle, XCircle } from "lucide-react"
import { updateUserAddress } from "@/lib/api"
import type { Address } from "@/types/api"

interface AddressFormProps {
  initialAddress?: Address | null
}

export function AddressForm({ initialAddress }: AddressFormProps) {
  const [address, setAddress] = useState<Partial<Address>>(
    initialAddress || {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      notes: "",
    },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress)
    }
  }, [initialAddress])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await updateUserAddress(address as Address)
      setSuccessMessage("Address updated successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("Failed to update address:", err)
      setError("Failed to update address. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-zubo-text-800 text-lg">
          <MapPin className="mr-2 h-5 w-5 text-zubo-primary-600" />
          My Address
        </CardTitle>
        <CardDescription className="text-zubo-text-600 text-sm">Update your primary address</CardDescription>
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
            <Label htmlFor="street" className="text-sm font-medium text-zubo-text-700">
              Street Address *
            </Label>
            <Input
              id="street"
              name="street"
              value={address.street || ""}
              onChange={handleInputChange}
              required
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="123 Main St"
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
                onChange={handleInputChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="Anytown"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-zubo-text-700">
                State / Province *
              </Label>
              <Input
                id="state"
                name="state"
                value={address.state || ""}
                onChange={handleInputChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="CA"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip" className="text-sm font-medium text-zubo-text-700">
                Zip / Postal Code *
              </Label>
              <Input
                id="zip"
                name="zip"
                value={address.zip || ""}
                onChange={handleInputChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="90210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-zubo-text-700">
                Country *
              </Label>
              <Input
                id="country"
                name="country"
                value={address.country || ""}
                onChange={handleInputChange}
                required
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="USA"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-zubo-text-700">
              Delivery Notes (optional)
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={address.notes || ""}
              onChange={handleInputChange}
              rows={3}
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="e.g., 'Leave package at back door'"
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
