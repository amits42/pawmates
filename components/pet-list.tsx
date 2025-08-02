"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { addPet, updatePet, deletePet } from "@/lib/api"
import {
  Plus,
  Edit,
  Trash2,
  PawPrint,
  Info,
  HeartPulse,
  AlertTriangle,
  Brain,
  Calendar,
  Stethoscope,
  Users,
  Dog,
  Heart,
} from "lucide-react"
import type { Pet } from "@/types/api"

interface PetListProps {
  pets?: Pet[]
  onPetAdded?: (pet: Pet) => void
  onPetUpdated?: (pet: Pet) => void
  onPetDeleted?: (petId: string) => void
}

export function PetList({ pets: initialPets = [], onPetAdded, onPetUpdated, onPetDeleted }: PetListProps) {
  const [pets, setPets] = useState<Pet[]>(Array.isArray(initialPets) ? initialPets : [])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentPet, setCurrentPet] = useState<Pet | null>(null)
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
    adoptionOrBirthday: "",
    microchipped: "not_sure",
    spayedNeutered: "not_sure",
    pottyTrained: "not_sure",
    friendlyWithChildren: "not_sure",
    friendlyWithDogs: "not_sure",
    friendlyWithAnimals: "not_sure",
    vetName: "",
    vetAddress: "",
    vetPhone: "",
    currentMedications: "",
    otherMedicalInfo: "",
  })

  // Sync with parent pets prop
  useEffect(() => {
    console.log("🔄 PetList: Syncing with parent pets:", initialPets)
    setPets(Array.isArray(initialPets) ? initialPets : [])
  }, [initialPets])

  const handleAddPet = async () => {
    if (!newPet.name.trim()) {
      alert("Please enter a pet name")
      return
    }

    setLoading(true)
    try {
      console.log("🐾 Adding new pet:", newPet)
      const addedPet = await addPet(newPet)
      console.log("✅ Pet added successfully:", addedPet)

      // Update local state immediately
      setPets((prevPets) => [addedPet, ...prevPets])

      // Call parent callback if provided
      if (onPetAdded) {
        console.log("📞 Calling parent onPetAdded callback")
        onPetAdded(addedPet)
      }

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
        adoptionOrBirthday: "",
        microchipped: "not_sure",
        spayedNeutered: "not_sure",
        pottyTrained: "not_sure",
        friendlyWithChildren: "not_sure",
        friendlyWithDogs: "not_sure",
        friendlyWithAnimals: "not_sure",
        vetName: "",
        vetAddress: "",
        vetPhone: "",
        currentMedications: "",
        otherMedicalInfo: "",
      })
    } catch (error) {
      console.error("❌ Error adding pet:", error)
      alert("Failed to add pet. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePet = async () => {
    if (!currentPet) return

    setLoading(true)
    try {
      console.log("📝 Updating pet:", currentPet)
      const updatedPet = await updatePet(currentPet)
      console.log("✅ Pet updated successfully:", updatedPet)

      // Update local state immediately
      setPets((prevPets) => prevPets.map((pet) => (pet.id === updatedPet.id ? updatedPet : pet)))

      // Call parent callback if provided
      if (onPetUpdated) {
        console.log("📞 Calling parent onPetUpdated callback")
        onPetUpdated(updatedPet)
      }

      setIsEditDialogOpen(false)
      setCurrentPet(null)
    } catch (error) {
      console.error("❌ Error updating pet:", error)
      alert("Failed to update pet. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePet = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pet?")) {
      return
    }

    setLoading(true)
    try {
      console.log("🗑️ Deleting pet:", id)
      await deletePet(id)
      console.log("✅ Pet deleted successfully")

      // Update local state immediately
      setPets((prevPets) => prevPets.filter((pet) => pet.id !== id))

      // Call parent callback if provided
      if (onPetDeleted) {
        console.log("📞 Calling parent onPetDeleted callback")
        onPetDeleted(id)
      }
    } catch (error) {
      console.error("❌ Error deleting pet:", error)
      alert("Failed to delete pet. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleNewPetChange = (field: string, value: string) => {
    console.log(`🔄 New pet field changed: ${field} = ${value}`)
    setNewPet((prev) => ({ ...prev, [field]: value }))
  }

  const handleCurrentPetChange = (field: string, value: string) => {
    if (!currentPet) return
    console.log(`🔄 Current pet field changed: ${field} = ${value}`)
    setCurrentPet((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const openEditDialog = (pet: Pet) => {
    console.log("✏️ Opening edit dialog for pet:", pet)
    setCurrentPet(pet)
    setIsEditDialogOpen(true)
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

  const formatYesNoNotSure = (value?: string) => {
    switch (value) {
      case "yes":
        return "Yes"
      case "no":
        return "No"
      case "not_sure":
      default:
        return "Not Sure"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return "Invalid date"
    }
  }

  const safePets = pets || []

  console.log("🐾 PetList render:", {
    petsCount: safePets.length,
    isAddDialogOpen,
    isEditDialogOpen,
    loading,
    pets: safePets.map((p) => ({
      id: p.id,
      name: p.name,
      hasImage: !!p.image,
      otherMedicalInfo: !!p.otherMedicalInfo,
      behavioralNotes: !!p.behavioralNotes,
    })),
  })

  const renderPetForm = (pet: any, isEdit = false) => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="social">Social</TabsTrigger>
        <TabsTrigger value="medical">Medical</TabsTrigger>
        <TabsTrigger value="vet">Vet Info</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <PetImageUpload
          currentImage={pet.image}
          onImageChange={(imageUrl) =>
            isEdit ? handleCurrentPetChange("image", imageUrl) : handleNewPetChange("image", imageUrl)
          }
          petName={pet.name}
        />

        <div className="space-y-2">
          <Label htmlFor={`pet-name-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-slate-700">
            Pet Name *
          </Label>
          <Input
            id={`pet-name-${isEdit ? "edit" : "add"}`}
            value={pet.name}
            onChange={(e) =>
              isEdit ? handleCurrentPetChange("name", e.target.value) : handleNewPetChange("name", e.target.value)
            }
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter pet name"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`pet-type-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-slate-700">
              Type
            </Label>
            <Select
              value={pet.type}
              onValueChange={(value) =>
                isEdit ? handleCurrentPetChange("type", value) : handleNewPetChange("type", value)
              }
            >
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
            <Label htmlFor={`pet-breed-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-slate-700">
              Breed
            </Label>
            <Input
              id={`pet-breed-${isEdit ? "edit" : "add"}`}
              value={pet.breed}
              onChange={(e) =>
                isEdit ? handleCurrentPetChange("breed", e.target.value) : handleNewPetChange("breed", e.target.value)
              }
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Breed"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`pet-age-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-slate-700">
              Age
            </Label>
            <Input
              id={`pet-age-${isEdit ? "edit" : "add"}`}
              value={pet.age}
              onChange={(e) =>
                isEdit ? handleCurrentPetChange("age", e.target.value) : handleNewPetChange("age", e.target.value)
              }
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Age"
              type="number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`pet-weight-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-slate-700">
              Weight (kg)
            </Label>
            <Input
              id={`pet-weight-${isEdit ? "edit" : "add"}`}
              value={pet.weight}
              onChange={(e) =>
                isEdit ? handleCurrentPetChange("weight", e.target.value) : handleNewPetChange("weight", e.target.value)
              }
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Weight"
              type="number"
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`pet-gender-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-slate-700">
              Gender
            </Label>
            <Select
              value={pet.gender}
              onValueChange={(value) =>
                isEdit ? handleCurrentPetChange("gender", value) : handleNewPetChange("gender", value)
              }
            >
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
        <div className="space-y-2">
          <Label
            htmlFor={`pet-description-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-slate-700 flex items-center"
          >
            <Info className="h-4 w-4 mr-1 text-green-600" />
            General Description
          </Label>
          <Textarea
            id={`pet-description-${isEdit ? "edit" : "add"}`}
            value={pet.description || ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("description", e.target.value)
                : handleNewPetChange("description", e.target.value)
            }
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
            placeholder="General description, personality, and any other information about your pet"
          />
        </div>
      </TabsContent>

      <TabsContent value="profile" className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor={`pet-birthday-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-slate-700 flex items-center"
          >
            <Calendar className="h-4 w-4 mr-1 text-blue-600" />
            Adoption or Birthday
          </Label>
          <Input
            id={`pet-birthday-${isEdit ? "edit" : "add"}`}
            type="date"
            value={pet.adoptionOrBirthday || ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("adoptionOrBirthday", e.target.value)
                : handleNewPetChange("adoptionOrBirthday", e.target.value)
            }
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Microchipped</Label>
            <Select
              value={pet.microchipped}
              onValueChange={(value) =>
                isEdit ? handleCurrentPetChange("microchipped", value) : handleNewPetChange("microchipped", value)
              }
            >
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="not_sure">Not Sure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {pet.gender === "female" ? "Spayed" : "Neutered"}
            </Label>
            <Select
              value={pet.spayedNeutered}
              onValueChange={(value) =>
                isEdit ? handleCurrentPetChange("spayedNeutered", value) : handleNewPetChange("spayedNeutered", value)
              }
            >
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="not_sure">Not Sure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Potty Trained</Label>
          <Select
            value={pet.pottyTrained}
            onValueChange={(value) =>
              isEdit ? handleCurrentPetChange("pottyTrained", value) : handleNewPetChange("pottyTrained", value)
            }
          >
            <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="not_sure">Not Sure</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="social" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center">
              <Users className="h-4 w-4 mr-1 text-green-600" />
              Friendly with children?
            </Label>
            <Select
              value={pet.friendlyWithChildren}
              onValueChange={(value) =>
                isEdit
                  ? handleCurrentPetChange("friendlyWithChildren", value)
                  : handleNewPetChange("friendlyWithChildren", value)
              }
            >
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="not_sure">Not Sure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center">
              <Dog className="h-4 w-4 mr-1 text-blue-600" />
              Friendly with other dogs?
            </Label>
            <Select
              value={pet.friendlyWithDogs}
              onValueChange={(value) =>
                isEdit
                  ? handleCurrentPetChange("friendlyWithDogs", value)
                  : handleNewPetChange("friendlyWithDogs", value)
              }
            >
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="not_sure">Not Sure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center">
              <Heart className="h-4 w-4 mr-1 text-purple-600" />
              Friendly with other animals?
            </Label>
            <Select
              value={pet.friendlyWithAnimals}
              onValueChange={(value) =>
                isEdit
                  ? handleCurrentPetChange("friendlyWithAnimals", value)
                  : handleNewPetChange("friendlyWithAnimals", value)
              }
            >
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="not_sure">Not Sure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="medical" className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor={`pet-other-medical-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-slate-700 flex items-center"
          >
            <HeartPulse className="h-4 w-4 mr-1 text-red-600" />
            Other Medical Info (e.g., Allergies)
          </Label>
          <Textarea
            id={`pet-other-medical-${isEdit ? "edit" : "add"}`}
            value={pet.otherMedicalInfo || ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("otherMedicalInfo", e.target.value)
                : handleNewPetChange("otherMedicalInfo", e.target.value)
            }
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
            placeholder="Any medical conditions, allergies, health history, or special medical needs"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={`pet-medications-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-slate-700 flex items-center"
          >
            <AlertTriangle className="h-4 w-4 mr-1 text-amber-600" />
            Current Medications
          </Label>
          <Textarea
            id={`pet-medications-${isEdit ? "edit" : "add"}`}
            value={pet.currentMedications || ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("currentMedications", e.target.value)
                : handleNewPetChange("currentMedications", e.target.value)
            }
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
            placeholder="List any current medications, dosages, and frequency"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={`pet-behavior-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-slate-700 flex items-center"
          >
            <Brain className="h-4 w-4 mr-1 text-purple-600" />
            Behavioral Notes
          </Label>
          <Textarea
            id={`pet-behavior-${isEdit ? "edit" : "add"}`}
            value={pet.behavioralNotes || ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("behavioralNotes", e.target.value)
                : handleNewPetChange("behavioralNotes", e.target.value)
            }
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
            placeholder="Temperament, training level, special behaviors, likes/dislikes, etc."
          />
        </div>
      </TabsContent>

      <TabsContent value="vet" className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor={`vet-name-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-slate-700 flex items-center"
          >
            <Stethoscope className="h-4 w-4 mr-1 text-blue-600" />
            Dr. Name
          </Label>
          <Input
            id={`vet-name-${isEdit ? "edit" : "add"}`}
            value={pet.vetName || ""}
            onChange={(e) =>
              isEdit ? handleCurrentPetChange("vetName", e.target.value) : handleNewPetChange("vetName", e.target.value)
            }
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Veterinarian's name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`vet-address-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-slate-700">
            Address
          </Label>
          <Textarea
            id={`vet-address-${isEdit ? "edit" : "add"}`}
            value={pet.vetAddress || ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("vetAddress", e.target.value)
                : handleNewPetChange("vetAddress", e.target.value)
            }
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
            placeholder="Veterinary clinic address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`vet-phone-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-slate-700">
            Number
          </Label>
          <Input
            id={`vet-phone-${isEdit ? "edit" : "add"}`}
            value={pet.vetPhone || ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("vetPhone", e.target.value)
                : handleNewPetChange("vetPhone", e.target.value)
            }
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Veterinary clinic phone number"
            type="tel"
          />
        </div>
      </TabsContent>
    </Tabs>
  )

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-slate-800 text-lg">
          <PawPrint className="mr-2 h-5 w-5 text-blue-600" />
          My Pets
          {safePets.length > 0 && (
            <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{safePets.length}</span>
          )}
        </CardTitle>
        <CardDescription className="text-slate-600 text-sm">Manage your pets' information</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {safePets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🐾</div>
            <p className="text-slate-600 font-medium">No pets added yet</p>
            <p className="text-slate-500 text-sm mt-1">Add your first pet to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safePets.map((pet) => (
              <Card key={pet.id} className="border-slate-200 bg-slate-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Pet Image or Emoji */}
                      <div className="relative">
                        {pet.image ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-slate-200 bg-white relative">
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
                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl">${getPetTypeEmoji(pet.type)}</div>`
                                }
                              }}
                            />
                            {/* Small type icon overlay */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-slate-200 flex items-center justify-center text-xs shadow-sm">
                              {getPetTypeEmoji(pet.type)}
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg border-2 border-slate-200 bg-white flex items-center justify-center text-2xl">
                            {getPetTypeEmoji(pet.type)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 truncate">{pet.name || "Unnamed Pet"}</h4>
                        <p className="text-sm text-slate-600">
                          {pet.type} • {pet.breed || "Mixed"} • {pet.gender || "Unknown"}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <span>Age: {pet.age || "Unknown"}</span>
                          <span>Weight: {pet.weight || "Unknown"} kg</span>
                          {pet.adoptionOrBirthday && <span>Birthday: {formatDate(pet.adoptionOrBirthday)}</span>}
                        </div>
                        {pet.description && (
                          <p className="text-xs text-slate-600 mt-2 line-clamp-2">{pet.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pet.otherMedicalInfo && pet.otherMedicalInfo.trim() && (
                            <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full flex items-center">
                              <HeartPulse className="h-3 w-3 mr-1" />
                              Medical
                            </span>
                          )}
                          {pet.currentMedications && pet.currentMedications.trim() && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Medications
                            </span>
                          )}
                          {pet.behavioralNotes && pet.behavioralNotes.trim() && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full flex items-center">
                              <Brain className="h-3 w-3 mr-1" />
                              Behavior
                            </span>
                          )}
                          {pet.vetName && pet.vetName.trim() && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                              <Stethoscope className="h-3 w-3 mr-1" />
                              Vet Info
                            </span>
                          )}
                        </div>

                        {/* Enhanced Profile Info */}
                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                          <div>Microchipped: {formatYesNoNotSure(pet.microchipped)}</div>
                          <div>
                            {pet.gender === "female" ? "Spayed" : "Neutered"}: {formatYesNoNotSure(pet.spayedNeutered)}
                          </div>
                          <div>Potty Trained: {formatYesNoNotSure(pet.pottyTrained)}</div>
                          <div>Child Friendly: {formatYesNoNotSure(pet.friendlyWithChildren)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(pet)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                        disabled={loading}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePet(pet.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                        disabled={loading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                console.log("🐾 Add Pet button clicked!")
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Pet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Add New Pet</DialogTitle>
              <DialogDescription className="text-slate-600">Enter your pet's information below.</DialogDescription>
            </DialogHeader>

            {renderPetForm(newPet, false)}

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  console.log("🐾 Cancel button clicked")
                  setIsAddDialogOpen(false)
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  console.log("🐾 Add Pet submit button clicked")
                  handleAddPet()
                }}
                disabled={loading || !newPet.name.trim()}
              >
                {loading ? "Adding..." : "Add Pet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Edit Pet</DialogTitle>
              <DialogDescription className="text-slate-600">Update your pet's information.</DialogDescription>
            </DialogHeader>
            {currentPet && renderPetForm(currentPet, true)}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePet} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}

export default PetList
