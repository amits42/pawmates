'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { fetchUserProfile, updateUserProfile } from '@/lib/api'
import { UserProfile } from '@/types/api'
import { User, Settings, Bell, Shield, CreditCard, MapPin, Phone, Mail, Calendar, Camera } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await fetchUserProfile()
      setProfile(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => prev ? { ...prev, [name]: value } : null)
  }

  const handleProfileUpdate = async () => {
    if (!profile) return

    setUpdating(true)
    try {
      const updatedProfile = await updateUserProfile({
        name: profile.name,
        email: profile.email,
        address: profile.address,
      })
      setProfile(updatedProfile)
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zubo-primary-100 rounded w-1/4"></div>
          <div className="h-64 bg-zubo-primary-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zubo-text-900 mb-2">Profile Settings</h1>
        <p className="text-zubo-text-600">Manage your account settings and preferences</p>
        {profile?.name && <p className="text-zubo-primary-600 mt-1">Welcome, {profile.name}!</p>}
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-zubo-primary-50 border border-zubo-primary-200">
          <TabsTrigger 
            value="personal" 
            className="data-[state=active]:bg-zubo-primary-600 data-[state=active]:text-white"
          >
            <User className="w-4 h-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger 
            value="preferences" 
            className="data-[state=active]:bg-zubo-primary-600 data-[state=active]:text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-zubo-primary-600 data-[state=active]:text-white"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="data-[state=active]:bg-zubo-primary-600 data-[state=active]:text-white"
          >
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card className="border-zubo-primary-200">
            <CardHeader className="bg-zubo-primary-50">
              <CardTitle className="text-zubo-text-900 flex items-center gap-2">
                <User className="w-5 h-5 text-zubo-primary-600" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-zubo-text-600">
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20 border-2 border-zubo-primary-200">
                  <AvatarImage src={profile?.profileImage || "/placeholder.svg"} />
                  <AvatarFallback className="bg-zubo-accent-100 text-zubo-text-700 text-lg">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="border-zubo-primary-300 text-zubo-primary-700 hover:bg-zubo-primary-50">
                    <Camera className="w-4 h-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-zubo-text-500 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <Separator className="bg-zubo-primary-200" />

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zubo-text-700 font-medium">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={profile?.name || ""}
                    onChange={handleInputChange}
                    className="border-zubo-primary-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zubo-text-700 font-medium">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile?.email || ""}
                    onChange={handleInputChange}
                    className="border-zubo-primary-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zubo-text-700 font-medium">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profile?.phone || ""}
                    disabled
                    className="border-zubo-primary-300 bg-zubo-primary-50 text-zubo-text-600"
                  />
                  <p className="text-xs text-zubo-text-500">Phone number cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="createdAt" className="text-zubo-text-700 font-medium">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Member Since
                  </Label>
                  <Input
                    id="createdAt"
                    value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ""}
                    disabled
                    className="border-zubo-primary-300 bg-zubo-primary-50 text-zubo-text-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-zubo-text-700 font-medium">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={profile?.address || ""}
                  onChange={handleInputChange}
                  className="border-zubo-primary-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-200"
                  rows={3}
                  placeholder="Enter your full address"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleProfileUpdate}
                  disabled={updating}
                  className="bg-zubo-primary-600 hover:bg-zubo-primary-700 text-white px-6"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="border-zubo-highlight-1-200">
            <CardHeader className="bg-zubo-highlight-1-50">
              <CardTitle className="text-zubo-text-900">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zubo-text-800">Account Verification</p>
                  <p className="text-sm text-zubo-text-600">Your account is verified and active</p>
                </div>
                <Badge className="bg-zubo-highlight-1-100 text-zubo-highlight-1-800 border-zubo-highlight-1-300">
                  Verified
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-zubo-primary-200">
            <CardHeader className="bg-zubo-primary-50">
              <CardTitle className="text-zubo-text-900">App Preferences</CardTitle>
              <CardDescription className="text-zubo-text-600">
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-zubo-text-600">Preferences settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-zubo-primary-200">
            <CardHeader className="bg-zubo-primary-50">
              <CardTitle className="text-zubo-text-900">Notification Settings</CardTitle>
              <CardDescription className="text-zubo-text-600">
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-zubo-text-600">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-zubo-primary-200">
            <CardHeader className="bg-zubo-primary-50">
              <CardTitle className="text-zubo-text-900">Security Settings</CardTitle>
              <CardDescription className="text-zubo-text-600">
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-zubo-text-600">Security settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
