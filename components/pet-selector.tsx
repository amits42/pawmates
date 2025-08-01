"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PetImageUpload } from "@/components/pet-image-upload"
import { useState } from "react"
import { addPet, fetchUserPets } from "@/lib/api"
import { Plus, Info, HeartPulse, AlertTriangle, Brain } from "lucide-react"
import type { Pet } from "@/types/api"

interface PetSelectorProps {
  pets: Pet[]
  selectedPetId: string | null
  onSelectPet: (id: string) => void
  onPetsUpdate?: (pets: Pet[]) => void
}

export function PetSelector({ pets, selectedPetId, onSelectPet, onPetsUpdate }: PetSelectorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newPet, setNewPet] = useState({
    name: "",
    type: "dog",
    breed: "",
    age: "",
    weight: "",
    gender: "unknown",
    description: "",
    medicalInfo: "",
    allergies: "",
    behavioralNotes: "",
    image: "",
  })

  console.log("🐾 PetSelector rendering, isAddDialogOpen:", isAddDialogOpen)

  const handleAddPet = async () => {
    // Prevent multiple simultaneous calls
    if (loading) return

    if (!newPet.name.trim()) {
      alert("Please enter a pet name")
      return
    }

    setLoading(true)
    try {
      console.log("🐾 Adding new pet from PetSelector:", newPet)

      const addedPet = await addPet({
        ...newPet,
        age: Number.parseInt(newPet.age) || 0,
        weight: Number.parseFloat(newPet.weight) || 0,
        userId: "user_1749099951828",
        isActive: true,
      })

      console.log("✅ Pet added successfully:", addedPet)

      // Update the pets list if callback provided
      if (onPetsUpdate) {
        const updatedPets = await fetchUserPets()
        onPetsUpdate(updatedPets)
      }

      // Select the newly added pet
      onSelectPet(addedPet.id)

      // Close dialog and reset form
      setIsAddDialogOpen(false)
      setNewPet({
        name: "",
        type: "dog",
        breed: "",
        age: "",
        weight: "",
        gender: "unknown",
        description: "",
        medicalInfo: "",
        allergies: "",
        behavioralNotes: "",
        image: "",
      })
    } catch (error) {
      console.error("❌ Error adding pet:", error)
      alert("Failed to add pet. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleNewPetChange = (field: string, value: string) => {
    setNewPet((prev) => ({ ...prev, [field]: value }))
  }

  const getPetTypeEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case "dog":
        return "🐕"
      case "cat":
        return "🐱"
      case "bird":
        return "🐦"
      default:
        return "🐾"
    }
  }

  return (
    <div className="space-y-4">
      {pets.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-zubo-text-neutral-600 font-medium mb-2">No pets added yet</p>
          <p className="text-zubo-text-neutral-500 text-sm mb-4">Add your first pet to get started</p>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-zubo-primary hover:bg-zubo-primary-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Pet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-zubo-text-neutral-800">Add New Pet</DialogTitle>
                <DialogDescription className="text-zubo-text-neutral-600">
                  Enter your pet's information below.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="medical">Medical</TabsTrigger>
                  <TabsTrigger value="behavior">Behavior</TabsTrigger>
                  <TabsTrigger value="description">Description</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <PetImageUpload
                    currentImage={newPet.image}
                    onImageChange={(imageUrl) => handleNewPetChange("image", imageUrl)}
                    petName={newPet.name}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="pet-name" className="text-sm font-medium text-zubo-text-neutral-700">
                      Pet Name *
                    </Label>
                    <Input
                      id="pet-name"
                      value={newPet.name}
                      onChange={(e) => handleNewPetChange("name", e.target.value)}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                      placeholder="Enter pet name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="pet-type" className="text-sm font-medium text-zubo-text-neutral-700">
                        Type
                      </Label>
                      <Select value={newPet.type} onValueChange={(value) => handleNewPetChange("type", value)}>
                        <SelectTrigger className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dog">🐕 Dog</SelectItem>
                          <SelectItem value="cat">🐱 Cat</SelectItem>
                          <SelectItem value="bird">🐦 Bird</SelectItem>
                          <SelectItem value="other">🐾 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pet-breed" className="text-sm font-medium text-zubo-text-neutral-700">
                        Breed
                      </Label>
                      <Input
                        id="pet-breed"
                        value={newPet.breed}
                        onChange={(e) => handleNewPetChange("breed", e.target.value)}
                        className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                        placeholder="Breed"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="pet-age" className="text-sm font-medium text-zubo-text-neutral-700">
                        Age
                      </Label>
                      <Input
                        id="pet-age"
                        value={newPet.age}
                        onChange={(e) => handleNewPetChange("age", e.target.value)}
                        className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                        placeholder="Age"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pet-weight" className="text-sm font-medium text-zubo-text-neutral-700">
                        Weight (kg)
                      </Label>
                      <Input
                        id="pet-weight"
                        value={newPet.weight}
                        onChange={(e) => handleNewPetChange("weight", e.target.value)}
                        className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                        placeholder="Weight"
                        type="number"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pet-gender" className="text-sm font-medium text-zubo-text-neutral-700">
                        Gender
                      </Label>
                      <Select value={newPet.gender} onValueChange={(value) => handleNewPetChange("gender", value)}>
                        <SelectTrigger className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pet-medical"
                      className="text-sm font-medium text-zubo-text-neutral-700 flex items-center"
                    >
                      <HeartPulse className="h-4 w-4 mr-1 text-zubo-primary-600" />
                      Medical Information
                    </Label>
                    <Textarea
                      id="pet-medical"
                      value={newPet.medicalInfo}
                      onChange={(e) => handleNewPetChange("medicalInfo", e.target.value)}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 min-h-[100px]"
                      placeholder="Any medical conditions, medications, or health history"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="pet-allergies"
                      className="text-sm font-medium text-zubo-text-neutral-700 flex items-center"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1 text-zubo-highlight-2" />
                      Allergies
                    </Label>
                    <Textarea
                      id="pet-allergies"
                      value={newPet.allergies}
                      onChange={(e) => handleNewPetChange("allergies", e.target.value)}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 min-h-[100px]"
                      placeholder="Any known allergies to food, medication, or environment"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="behavior" className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pet-behavior"
                      className="text-sm font-medium text-zubo-text-neutral-700 flex items-center"
                    >
                      <Brain className="h-4 w-4 mr-1 text-zubo-highlight-1" />
                      Behavioral Notes
                    </Label>
                    <Textarea
                      id="pet-behavior"
                      value={newPet.behavioralNotes}
                      onChange={(e) => handleNewPetChange("behavioralNotes", e.target.value)}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 min-h-[150px]"
                      placeholder="Temperament, training level, special behaviors, likes/dislikes, etc."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="description" className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pet-description"
                      className="text-sm font-medium text-zubo-text-neutral-700 flex items-center"
                    >
                      <Info className="h-4 w-4 mr-1 text-zubo-accent-600" />
                      General Description
                    </Label>
                    <Textarea
                      id="pet-description"
                      value={newPet.description}
                      onChange={(e) => handleNewPetChange("description", e.target.value)}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 min-h-[150px]"
                      placeholder="General description, personality, and any other information about your pet"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleAddPet} disabled={loading || !newPet.name.trim()}>
                  {loading ? "Adding..." : "Add Pet"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pets.map((pet) => (
            <Card
              key={pet.id}
              className={`cursor-pointer transition-all border-zubo-text-neutral-200 hover:border-zubo-primary-300 ${
                selectedPetId === pet.id ? "ring-2 ring-zubo-primary-500 border-zubo-primary-500" : ""
              }`}
              onClick={() => onSelectPet(pet.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Pet Image or Emoji */}
                  <div className="relative">
                    {pet.image ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-zubo-text-neutral-200 bg-white relative">
                        <img
                          src={pet.image || "/placeholder.svg"}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error("❌ Error loading pet image:", pet.image)
                            // Fallback to emoji if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xl">${getPetTypeEmoji(pet.type)}</div>`
                            }
                          }}
                        />
                        {/* Small type icon overlay */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full border border-zubo-text-neutral-200 flex items-center justify-center text-xs shadow-sm">
                          {getPetTypeEmoji(pet.type)}
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg border-2 border-zubo-text-neutral-200 bg-white flex items-center justify-center text-xl">
                        {getPetTypeEmoji(pet.type)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-zubo-text-neutral-800 truncate">{pet.name}</h4>
                    <p className="text-sm text-zubo-text-neutral-600">
                      {pet.type} • {pet.breed || "Mixed"}
                    </p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-zubo-text-neutral-500">
                      <span>Age: {pet.age || "Unknown"}</span>
                      <span>Weight: {pet.weight || "Unknown"} kg</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Card
              className="cursor-pointer border-dashed border-zubo-text-neutral-300 hover:border-zubo-primary-300 transition-colors"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="rounded-full w-10 h-10 bg-zubo-background-100 flex items-center justify-center mb-2">
                  <Plus className="h-5 w-5 text-zubo-text-neutral-600" />
                </div>
                <p className="font-medium text-zubo-text-neutral-700 text-sm">Add New Pet</p>
              </CardContent>
            </Card>

            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-zubo-text-neutral-800">Add New Pet</DialogTitle>
                <DialogDescription className="text-zubo-text-neutral-600">
                  Enter your pet's information below.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="medical">Medical</TabsTrigger>
                  <TabsTrigger value="behavior">Behavior</TabsTrigger>
                  <TabsTrigger value="description">Description</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <PetImageUpload
                    currentImage={newPet.image}
                    onImageChange={(imageUrl) => handleNewPetChange("image", imageUrl)}
                    petName={newPet.name}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="pet-name-2" className="text-sm font-medium text-zubo-text-neutral-700">
                      Pet Name *
                    </Label>
                    <Input
                      id="pet-name-2"
                      value={newPet.name}
                      onChange={(e) => handleNewPetChange("name", e.target.value)}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                      placeholder="Enter pet name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="pet-type-2" className="text-sm font-medium text-zubo-text-neutral-700">
                        Type
                      </Label>
                      <Select value={newPet.type} onValueChange={(value) => handleNewPetChange("type", value)}>
                        <SelectTrigger className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dog">🐕 Dog</SelectItem>
                          <SelectItem value="cat">🐱 Cat</SelectItem>
                          <SelectItem value="bird">🐦 Bird</SelectItem>
                          <SelectItem value="other">🐾 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pet-breed-2" className="text-sm font-medium text-zubo-text-neutral-700">
                        Breed
                      </Label>
                      <Input
                        id="pet-breed-2"
                        value={newPet.breed}
                        onChange={(e) => handleNewPetChange("breed", e.target.value)}
                        className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                        placeholder="Breed"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="pet-age-2" className="text-sm font-medium text-zubo-text-neutral-700">
                        Age
                      </Label>
                      <Input
                        id="pet-age-2"
                        value={newPet.age}
                        onChange={(e) => handleNewPetChange("age", e.target.value)}
                        className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                        placeholder="Age"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pet-weight-2" className="text-sm font-medium text-zubo-text-neutral-700">
                        Weight (kg)
                      </Label>
                      <Input
                        id="pet-weight-2"
                        value={newPet.weight}
                        onChange={(e) => handleNewPetChange("weight", e.target.value)}
                        className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                        placeholder="Weight"
                        type="number"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pet-gender-2" className="text-sm font-medium text-zubo-text-neutral-700">
                        Gender
                      </Label>
                      <Select value={newPet.gender} onValueChange={(value) => handleNewPetChange("gender", value)}>
                        <SelectTrigger className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pet-medical-2"
                      className="text-sm font-medium text-zubo-text-neutral-700 flex items-center"
                    >
                      <HeartPulse className="h-4 w-4 mr-1 text-zubo-primary-600" />
                      Medical Information
                    </Label>
                    <Textarea
                      id="pet-medical-2"
                      value={newPet.medicalInfo}
                      onChange={(e) => handleNewPetChange("medicalInfo", e.target.value)}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 min-h-[100px]"
                      placeholder="Any medical conditions, medications, or health history"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="pet-allergies-2"
                      className="text-sm font-medium text-zubo-text-neutral-700 flex items-center"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1 text-zubo-highlight-2" />
                      Allergies
                    </Label>
                    <Textarea
                      id="pet-allergies-2"
                      value={newPet.allergies}
                      onChange={(e) => handleNewPetChange("allergies", e.target.value)}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 min-h-[100px]"
                      placeholder="Any known allergies to food, medication, or environment"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="behavior" className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pet-behavior-2"
                      className="text-sm font-medium text-zubo-text-neutral-700 flex items-center"
                    >
                      <Brain className="h-4 w-4 mr-1 text-zubo-highlight-1" />
                      Behavioral Notes
                    </Label>
                    <Textarea
                      id="pet-behavior-2"
                      value={newPet.behavioralNotes}
                      onChange={(e) => handleNewPetChange("behavioralNotes", e.target.value)}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 min-h-[150px]"
                      placeholder="Temperament, training level, special behaviors, likes/dislikes, etc."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="description" className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pet-description-2"
                      className="text-sm font-medium text-zubo-text-neutral-700 flex items-center"
                    >
                      <Info className="h-4 w-4 mr-1 text-zubo-accent-600" />
                      General Description
                    </Label>
                    <Textarea
                      id="pet-description-2"
                      value={newPet.description}
                      onChange={(e) => handleNewPetChange("description", e.target.value)}
                      className="border-zubo-text-neutral-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 min-h-[150px]"
                      placeholder="General description, personality, and any other information about your pet"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleAddPet} disabled={loading || !newPet.name.trim()}>
                  {loading ? "Adding..." : "Add Pet"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
