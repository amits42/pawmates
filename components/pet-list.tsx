"use client"

import { Alert } from "@/components/ui/alert"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, PlusCircle, Edit, Trash2, Save, XCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { PetImageUpload } from "@/components/pet-image-upload"
import type { Pet } from "@/types/api"

interface PetListProps {
  initialPets?: Pet[]
  onPetUpdate?: (pets: Pet[]) => void
}

export function PetList({ initialPets = [], onPetUpdate }: PetListProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [pets, setPets] = useState<Pet[]>(initialPets)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentPet, setCurrentPet] = useState<Pet | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchUserPets()
    }
  }, [user])

  const fetchUserPets = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/pets?userId=${user.id}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch pets")
      }
      const data = await response.json()
      setPets(data.pets || [])
      onPetUpdate?.(data.pets || [])
    } catch (err) {
      console.error("Error fetching pets:", err)
      setError("Failed to load pets. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load pets.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddPet = () => {
    setCurrentPet(null)
    setDialogError(null)
    setIsDialogOpen(true)
  }

  const handleEditPet = (pet: Pet) => {
    setCurrentPet(pet)
    setDialogError(null)
    setIsDialogOpen(true)
  }

  const handleDeletePet = async (petId: string) => {
    if (!user?.id || !confirm("Are you sure you want to delete this pet?")) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete pet")
      }

      toast({
        title: "Pet Deleted! 🗑️",
        description: "Your pet has been successfully removed.",
      })
      fetchUserPets() // Refresh the list
    } catch (err) {
      console.error("Error deleting pet:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete pet.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const petData = {
      name: formData.get("name") as string,
      species: formData.get("species") as string,
      breed: formData.get("breed") as string,
      age: Number.parseInt(formData.get("age") as string),
      gender: formData.get("gender") as string,
      notes: formData.get("notes") as string,
      imageUrl: formData.get("imageUrl") as string,
      userId: user.id,
    }

    if (!petData.name || !petData.species || !petData.breed || !petData.age || !petData.gender) {
      setDialogError("Please fill in all required fields.")
      return
    }

    setIsSaving(true)
    setDialogError(null)

    try {
      const method = currentPet ? "PUT" : "POST"
      const url = currentPet ? `/api/pets/${currentPet.id}` : "/api/pets"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
        body: JSON.stringify(petData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save pet")
      }

      toast({
        title: currentPet ? "Pet Updated! 🐾" : "Pet Added! 🎉",
        description: currentPet ? "Your pet's details have been updated." : "A new pet has been added to your profile.",
      })
      setIsDialogOpen(false)
      fetchUserPets() // Refresh the list
    } catch (err) {
      console.error("Error saving pet:", err)
      setDialogError(err instanceof Error ? err.message : "Failed to save pet.")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save pet.",
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
          <CardTitle className="text-lg font-semibold text-zubo-text-graphite-gray-900">Your Pets</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-zubo-primary-royal-midnight-blue-600" />
          <p className="ml-3 text-zubo-text-graphite-gray-600">Loading pets...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-zubo-text-graphite-gray-900">Your Pets</CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <Alert className="border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-destructive">{error}</p>
          </Alert>
          <Button onClick={fetchUserPets} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-zubo-text-graphite-gray-900">Your Pets</CardTitle>
        <Button
          onClick={handleAddPet}
          size="sm"
          className="bg-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-700 text-zubo-background-porcelain-white-50"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Pet
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {pets.length === 0 ? (
          <div className="text-center py-8 text-zubo-text-graphite-gray-600">
            <p>You haven't added any pets yet.</p>
            <p>Click "Add New Pet" to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map((pet) => (
              <Card key={pet.id} className="relative overflow-hidden group">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-50"
                    onClick={() => handleEditPet(pet)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeletePet(pet.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-0">
                  <div className="relative w-full h-40 bg-zubo-background-porcelain-white-200 flex items-center justify-center overflow-hidden">
                    {pet.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pet.imageUrl || "/placeholder.svg"}
                        alt={pet.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-6xl">🐾</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-zubo-text-graphite-gray-900">{pet.name}</h3>
                    <p className="text-sm text-zubo-text-graphite-gray-600">
                      {pet.species} ({pet.breed})
                    </p>
                    <p className="text-sm text-zubo-text-graphite-gray-600">
                      {pet.age} years old, {pet.gender}
                    </p>
                    {pet.notes && (
                      <p className="text-xs text-zubo-text-graphite-gray-500 mt-2 line-clamp-2">Notes: {pet.notes}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentPet ? "Edit Pet" : "Add New Pet"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePet} className="grid gap-4 py-4">
            {dialogError && (
              <Alert className="border-destructive bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-destructive">{dialogError}</p>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Pet Image</Label>
              <PetImageUpload
                initialImageUrl={currentPet?.imageUrl || ""}
                onUploadComplete={(url) => {
                  if (currentPet) {
                    setCurrentPet({ ...currentPet, imageUrl: url })
                  } else {
                    // For new pet, we might need a hidden input or handle this differently
                    // For now, assuming the form submission will pick it up from the hidden input
                  }
                  const hiddenInput = document.getElementById("imageUrl") as HTMLInputElement
                  if (hiddenInput) hiddenInput.value = url
                }}
              />
              <input type="hidden" id="imageUrl" name="imageUrl" value={currentPet?.imageUrl || ""} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" defaultValue={currentPet?.name || ""} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="species" className="text-right">
                Species
              </Label>
              <Select name="species" defaultValue={currentPet?.species || ""} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                  <SelectItem value="Bird">Bird</SelectItem>
                  <SelectItem value="Fish">Fish</SelectItem>
                  <SelectItem value="Rabbit">Rabbit</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="breed" className="text-right">
                Breed
              </Label>
              <Input id="breed" name="breed" defaultValue={currentPet?.breed || ""} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="age" className="text-right">
                Age
              </Label>
              <Input
                id="age"
                name="age"
                type="number"
                defaultValue={currentPet?.age || ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">
                Gender
              </Label>
              <Select name="gender" defaultValue={currentPet?.gender || ""} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea id="notes" name="notes" defaultValue={currentPet?.notes || ""} className="col-span-3" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
