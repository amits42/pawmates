"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Save, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Alert } from "@/components/ui/alert"
import type { UserAddress } from "@/types/api"

interface AddressFormProps {
  initialAddress?: UserAddress | null
  onAddressUpdate?: (address: UserAddress) => void
}

export function AddressForm({ initialAddress, onAddressUpdate }: AddressFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [address, setAddress] = useState<UserAddress | null>(initialAddress || null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchUserAddress()
    }
  }, [user])

  const fetchUserAddress = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/user/address?userId=${user.id}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
      })
      if (!response.ok) {
        if (response.status === 404) {
          setAddress(null) // No address found, treat as new
        } else {
          throw new Error("Failed to fetch address")
        }
      } else {
        const data = await response.json()
        setAddress(data.address || null)
        onAddressUpdate?.(data.address || null)
      }
    } catch (err) {
      console.error("Error fetching address:", err)
      setError("Failed to load address. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load address.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const addressData = {
      street: formData.get("street") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zipCode: formData.get("zipCode") as string,
      country: formData.get("country") as string,
      userId: user.id,
    }

    if (
      !addressData.street ||
      !addressData.city ||
      !addressData.state ||
      !addressData.zipCode ||
      !addressData.country
    ) {
      setError("Please fill in all required address fields.")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const method = address?.id ? "PUT" : "POST"
      const url = address?.id ? `/api/user/address?id=${address.id}` : "/api/user/address"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
        body: JSON.stringify(addressData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save address")
      }

      const result = await response.json()
      setAddress(result.address)
      onAddressUpdate?.(result.address)
      toast({
        title: "Address Saved! 🏠",
        description: "Your address has been successfully updated.",
      })
    } catch (err) {
      console.error("Error saving address:", err)
      setError(err instanceof Error ? err.message : "Failed to save address.")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save address.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-zubo-text-graphite-gray-900">Your Address</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-zubo-primary-royal-midnight-blue-600" />
          <p className="ml-3 text-zubo-text-graphite-gray-600">Loading address...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-zubo-text-graphite-gray-900">Your Address</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveAddress} className="grid gap-4">
          {error && (
            <Alert className="border-destructive bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-destructive">{error}</p>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="street">Street Address</Label>
            <Input id="street" name="street" defaultValue={address?.street || ""} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={address?.city || ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State / Province</Label>
              <Input id="state" name="state" defaultValue={address?.state || ""} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="zipCode">Zip / Postal Code</Label>
              <Input id="zipCode" name="zipCode" defaultValue={address?.zipCode || ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue={address?.country || ""} required />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-700 text-zubo-background-porcelain-white-50"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Address
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
