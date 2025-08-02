"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, PlusCircle, Edit, Save, XCircle, CheckCircle } from "lucide-react"
import { createPet, updatePet, deletePet } from "@/lib/api"
import type { Pet } from "@/types/api"
import { PetImageUpload } from "./pet-image-upload"
import { PawPrint } from "lucide-react" // Declared the PawPrint variable

interface PetListProps {
  pets: Pet[]
  onPetAdded: (newPet: Pet) => void
  onPetUpdated: (updatedPet: Pet) => void
  onPetDeleted: (petId: string) => void
}

export default function PetList({ pets, onPetAdded, onPetUpdated, onPetDeleted }: PetListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [newPet, setNewPet] = useState<Partial<Pet>>({
    name: "",
    species: "",
    breed: "",
    age: "",
    gender: "",
    notes: "",
    imageUrl: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleOpenDialog = (pet: Pet | null = null) => {
    setEditingPet(pet)
    setNewPet(pet || { name: "", species: "", breed: "", age: "", gender: "", notes: "", imageUrl: "" })
    setError(null)
    setSuccessMessage(null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingPet(null)
    setNewPet({ name: "", species: "", breed: "", age: "", gender: "", notes: "", imageUrl: "" })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewPet((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewPet((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUploadSuccess = (url: string) => {
    setNewPet((prev) => ({ ...prev, imageUrl: url }))
    setSuccessMessage("Image uploaded successfully!")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleImageUploadError = (errorMessage: string) => {
    setError(errorMessage)
    setTimeout(() => setError(null), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (editingPet) {
        const updated = await updatePet(editingPet.id, newPet as Pet)
        onPetUpdated(updated)
        setSuccessMessage("Pet updated successfully!")
      } else {
        const created = await createPet(newPet as Pet)
        onPetAdded(created)
        setSuccessMessage("Pet added successfully!")
      }
      handleCloseDialog()
    } catch (err) {
      console.error("Failed to save pet:", err)
      setError("Failed to save pet. Please try again.")
    } finally {
      setSaving(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleDelete = async (petId: string) => {
    if (window.confirm("Are you sure you want to delete this pet?")) {
      try {
        await deletePet(petId)
        onPetDeleted(petId)
        setSuccessMessage("Pet deleted successfully!")
      } catch (err) {
        console.error("Failed to delete pet:", err)
        setError("Failed to delete pet. Please try again.")
      } finally {
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    }
  }

  return (
    <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-zubo-text-800 text-lg">
          <PawPrint className="mr-2 h-5 w-5 text-zubo-primary-600" />
          My Pets
        </CardTitle>
        <CardDescription className="text-zubo-text-600 text-sm">Manage your beloved pets</CardDescription>
      </CardHeader>
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

        {pets.length === 0 ? (
          <div className="text-center py-8 text-zubo-text-500">
            <p>You haven't added any pets yet.</p>
            <p>Click the button below to add your first pet!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <Card key={pet.id} className="border-zubo-background-200 bg-zubo-background-100">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3 border-2 border-zubo-primary-200">
                    {pet.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pet.imageUrl || "/placeholder.svg"}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zubo-primary-400 to-zubo-highlight-2-500 text-zubo-background-50 text-4xl font-semibold">
                        {pet.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-zubo-text-800">{pet.name}</h3>
                  <p className="text-sm text-zubo-text-600">
                    {pet.species} {pet.breed ? `(${pet.breed})` : ""}
                  </p>
                  <p className="text-sm text-zubo-text-600">
                    {pet.age} years old, {pet.gender}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(pet)}
                      className="border-zubo-primary-300 text-zubo-primary-700 hover:bg-zubo-primary-50"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(pet.id)}
                      className="bg-zubo-highlight-1-600 hover:bg-zubo-highlight-1-700 text-zubo-background-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Pet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
            <DialogHeader>
              <DialogTitle className="text-zubo-text-900">{editingPet ? "Edit Pet" : "Add New Pet"}</DialogTitle>
              <DialogDescription className="text-zubo-text-600">
                {editingPet ? "Make changes to your pet's profile here." : "Add a new pet to your profile."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
                <Label htmlFor="imageUrl" className="text-sm font-medium text-zubo-text-700">
                  Pet Image
                </Label>
                <PetImageUpload
                  initialImageUrl={newPet.imageUrl}
                  onUploadSuccess={handleImageUploadSuccess}
                  onUploadError={handleImageUploadError}
                  className="border-zubo-background-300 bg-zubo-background-100 text-zubo-text-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-zubo-text-700">
                  Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newPet.name || ""}
                  onChange={handleInputChange}
                  required
                  className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                  placeholder="Pet's Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="species" className="text-sm font-medium text-zubo-text-700">
                  Species *
                </Label>
                <Select
                  name="species"
                  value={newPet.species || ""}
                  onValueChange={(value) => handleSelectChange("species", value)}
                  required
                >
                  <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
                    <SelectItem value="Dog" className="hover:bg-zubo-background-100">
                      Dog
                    </SelectItem>
                    <SelectItem value="Cat" className="hover:bg-zubo-background-100">
                      Cat
                    </SelectItem>
                    <SelectItem value="Bird" className="hover:bg-zubo-background-100">
                      Bird
                    </SelectItem>
                    <SelectItem value="Other" className="hover:bg-zubo-background-100">
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="breed" className="text-sm font-medium text-zubo-text-700">
                  Breed
                </Label>
                <Input
                  id="breed"
                  name="breed"
                  value={newPet.breed || ""}
                  onChange={handleInputChange}
                  className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                  placeholder="e.g., Golden Retriever"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-medium text-zubo-text-700">
                    Age *
                  </Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={newPet.age || ""}
                    onChange={handleInputChange}
                    required
                    className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-zubo-text-700">
                    Gender *
                  </Label>
                  <Select
                    name="gender"
                    value={newPet.gender || ""}
                    onValueChange={(value) => handleSelectChange("gender", value)}
                    required
                  >
                    <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
                      <SelectItem value="Male" className="hover:bg-zubo-background-100">
                        Male
                      </SelectItem>
                      <SelectItem value="Female" className="hover:bg-zubo-background-100">
                        Female
                      </SelectItem>
                      <SelectItem value="Other" className="hover:bg-zubo-background-100">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-zubo-text-700">
                  Notes (e.g., behavior, diet)
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newPet.notes || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                  placeholder="Any special instructions or notes about your pet..."
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="border-zubo-background-300 text-zubo-text-700 hover:bg-zubo-background-100 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Pet"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
