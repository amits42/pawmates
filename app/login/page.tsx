"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import {
  Phone,
  MessageSquare,
  Shield,
  Sparkles,
  Info,
  AlertTriangle,
  CheckCircle,
  Copy,
  User,
  Heart,
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { user, sitter, verifyOTP, loading, isNewUser } = useAuth()
  const [userType, setUserType] = useState<"pet_owner" | "sitter">("pet_owner")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOTP] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [demoOTP, setDemoOTP] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [fallbackMode, setFallbackMode] = useState(false)

  useEffect(() => {
    console.log("Login page - Auth state:", { user, sitter, isNewUser })

    if (user?.isAuthenticated) {
      if (isNewUser) {
        console.log("🔄 Login: Redirecting new user to onboarding")
        router.push("/onboarding/user-info")
      } else {
        // Check for post-login redirect
        let redirectPath = "/landing"
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("postLoginRedirect")
          if (stored && stored !== "/login") {
            redirectPath = stored
            localStorage.removeItem("postLoginRedirect")
          }
        }
        console.log("🔄 Login: Redirecting existing user to", redirectPath)
        router.push(redirectPath)
      }
    } else if (sitter) {
      // Check for post-login redirect for sitter as well
      let redirectPath = "/sitter"
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("postLoginRedirect")
        if (stored && stored !== "/login") {
          redirectPath = stored
          localStorage.removeItem("postLoginRedirect")
        }
      }
      console.log("🔄 Login: Redirecting sitter to", redirectPath)
      router.push(redirectPath)
    }
  }, [user, sitter, isNewUser, router])

  const copyOTPToInput = () => {
    if (demoOTP) {
      setOTP(demoOTP)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setDemoOTP("")
    setFallbackMode(false)
    setIsLoading(true)

    console.log("🚀 Starting OTP send process for:", phone)

    // Validate 10-digit Indian phone number
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      setError("Please enter a valid 10-digit Indian phone number")
      setIsLoading(false)
      return
    }

    try {
      // Always prepend +91 to the phone number
      const formattedPhone = `+91${phone}`

      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formattedPhone,
          userType: userType === "pet_owner" ? "PET_OWNER" : "SITTER",
        }),
      })

      console.log("📡 API response status:", response.status)

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("❌ Non-JSON response:", textResponse)
        setError("Server error. Please try again.")
        setIsLoading(false)
        return
      }

      const data = await response.json()
      console.log("📦 API response data:", data)

      if (data.success) {
        setSuccess(data.message)
        setStep("otp")
        setFallbackMode(data.fallbackMode || false)

        // Show demo OTP if available
        if (data.developmentOTP) {
          setDemoOTP(data.developmentOTP)
          console.log("🔐 Demo OTP available:", data.developmentOTP)
        }
      } else {
        setError(data.message || "Failed to send OTP")
      }
    } catch (error) {
      console.error("💥 Error sending OTP:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      setIsLoading(false)
      return
    }

    try {
      // Always prepend +91 to the phone number
      const formattedPhone = `+91${phone}`

      console.log(`🔐 Verifying OTP for ${formattedPhone} as ${userType}`)
      const isNewUser = await verifyOTP(formattedPhone, otp, userType)
      console.log(`✅ Verification result - isNewUser: ${isNewUser}`)

      // The redirect will happen in the useEffect above when auth state changes
    } catch (error) {
      console.error("❌ Verification error:", error)
      setError(error instanceof Error ? error.message : "Failed to verify OTP")
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError("")
    setSuccess("")
    setDemoOTP("")
    setFallbackMode(false)
    setIsLoading(true)

    try {
      // Always prepend +91 to the phone number
      const formattedPhone = `+91${phone}`

      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formattedPhone,
          userType: userType === "pet_owner" ? "PET_OWNER" : "SITTER",
        }),
      })

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("❌ Non-JSON response on resend:", textResponse)
        setError("Server error. Please try again.")
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        setSuccess("New OTP sent!")
        setFallbackMode(data.fallbackMode || false)
        if (data.developmentOTP) {
          setDemoOTP(data.developmentOTP)
        }
      } else {
        setError(data.message || "Failed to resend OTP")
      }
    } catch (error) {
      console.error("❌ Error resending OTP:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // If already authenticated, don't render the login form
  if (user?.isAuthenticated || sitter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text flex items-center justify-center mb-4">
            <Shield className="mr-3 h-10 w-10 text-green-600" />
            PetCare Login
            <Sparkles className="ml-3 h-6 w-6 text-yellow-500 animate-bounce" />
          </h1>
          <p className="text-gray-600">Secure OTP-based authentication</p>
        </div>

        <Card className="card-hover bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              {step === "phone" ? (
                <>
                  <Phone className="mr-2 h-5 w-5" />
                  Choose Login Type
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Verify OTP
                </>
              )}
            </CardTitle>
            <CardDescription className="text-green-600">
              {step === "phone" ? "Select your account type and enter phone number" : "Enter the 6-digit code"}
            </CardDescription>
          </CardHeader>

          {step === "phone" ? (
            <form onSubmit={handleSendOTP}>
              <CardContent className="space-y-6">
                <Tabs value={userType} onValueChange={(value) => setUserType(value as "pet_owner" | "sitter")}>
                  <TabsList className="grid w-full grid-cols-2 bg-white">
                    <TabsTrigger value="pet_owner" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Pet Owner</span>
                    </TabsTrigger>
                    <TabsTrigger value="sitter" className="flex items-center space-x-2">
                      <Heart className="h-4 w-4" />
                      <span>Pet Sitter</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pet_owner" className="mt-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-blue-700">Login as a pet owner to book services for your pets</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="sitter" className="mt-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <Heart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-purple-700">
                        Login as a pet sitter to manage your bookings and earnings
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-green-800 font-medium">
                    Phone Number
                  </Label>
                  <div className="flex">
                    <div className="bg-gray-100 border border-green-300 rounded-l-md px-3 flex items-center text-gray-600 font-medium">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="border-green-300 focus:border-green-500 focus:ring-green-500 rounded-l-none"
                    />
                  </div>
                  <p className="text-sm text-green-600">Enter your 10-digit mobile number</p>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    <strong>Testing:</strong>
                    {userType === "pet_owner" ? (
                      <span> Use 8892743780 for new user or 1234567890 for existing user</span>
                    ) : (
                      <span> Use 8892743780 or 1234567891 for sitter accounts</span>
                    )}
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send OTP ✨
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-600">
                    Logging in as:{" "}
                    <span className="font-semibold text-gray-800">
                      {userType === "pet_owner" ? "Pet Owner" : "Pet Sitter"}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-green-800 font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOTP(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    className="border-green-300 focus:border-green-500 focus:ring-green-500 text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-green-600">Code sent to: +91 {phone}</p>
                </div>

                {demoOTP && (
                  <Alert className={fallbackMode ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}>
                    <Info className={`h-4 w-4 ${fallbackMode ? "text-yellow-600" : "text-blue-600"}`} />
                    <AlertDescription className={fallbackMode ? "text-yellow-700" : "text-blue-700"}>
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>Your OTP:</strong> <span className="font-mono text-lg">{demoOTP}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copyOTPToInput}
                          className="ml-2 bg-transparent"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-gray-50 border-gray-200">
                  <Info className="h-4 w-4 text-gray-600" />
                  <AlertDescription className="text-gray-700">
                    <strong>Alternative:</strong> You can also use the test OTP: <strong>123456</strong> for any phone
                    number
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700"
                  >
                    Didn't receive code? Resend OTP
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Verify & Login ✨
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("phone")
                    setOTP("")
                    setError("")
                    setSuccess("")
                    setDemoOTP("")
                    setFallbackMode(false)
                  }}
                  className="w-full"
                >
                  Change Phone Number
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔒 Your phone number is secure and will only be used for authentication</p>
          <p className="mt-1">💡 For testing: Use test OTP: 123456</p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Powered by{" "}
              <a
                href="https://www.endgateglobal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
              >
                Endgate Global
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
