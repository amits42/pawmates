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
import { Phone, MessageSquare, Info, AlertTriangle, CheckCircle, Copy, User, Heart } from "lucide-react"
import Image from "next/image"

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

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      setError("Please enter a valid 10-digit Indian phone number")
      setIsLoading(false)
      return
    }

    try {
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
      const formattedPhone = `+91${phone}`

      console.log(`🔐 Verifying OTP for ${formattedPhone} as ${userType}`)
      const isNewUser = await verifyOTP(formattedPhone, otp, userType)
      console.log(`✅ Verification result - isNewUser: ${isNewUser}`)
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

  if (user?.isAuthenticated || sitter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zubo-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zubo-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zubo-background p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Image
            src="/logo/zubo-logo.svg"
            alt="ZuboPets"
            width={200}
            height={80}
            className="h-20 w-auto mx-auto mb-6"
            priority
          />
          <h1 className="text-2xl font-bold text-zubo-text mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your ZuboPets account</p>
        </div>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-zubo-text">
              {step === "phone" ? "Choose Account Type" : "Verify Your Phone"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {step === "phone"
                ? "Select your account type and enter your phone number"
                : "Enter the 6-digit code sent to your phone"}
            </CardDescription>
          </CardHeader>

          {step === "phone" ? (
            <form onSubmit={handleSendOTP}>
              <CardContent className="space-y-6">
                <Tabs value={userType} onValueChange={(value) => setUserType(value as "pet_owner" | "sitter")}>
                  <TabsList className="grid w-full grid-cols-2">
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
                    <div className="text-center p-4 bg-zubo-highlight-1 bg-opacity-20 rounded-lg border border-zubo-highlight-1 border-opacity-30">
                      <User className="h-8 w-8 text-zubo-primary mx-auto mb-2" />
                      <p className="text-sm text-zubo-text">Book trusted pet care services for your furry friends</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="sitter" className="mt-4">
                    <div className="text-center p-4 bg-zubo-accent bg-opacity-20 rounded-lg border border-zubo-accent border-opacity-30">
                      <Heart className="h-8 w-8 text-zubo-primary mx-auto mb-2" />
                      <p className="text-sm text-zubo-text">Provide loving care and earn money as a pet sitter</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zubo-text font-medium">
                    Phone Number
                  </Label>
                  <div className="flex">
                    <div className="bg-gray-100 border border-gray-300 rounded-l-md px-3 flex items-center text-gray-600 font-medium">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="rounded-l-none border-l-0 focus:ring-zubo-primary focus:border-zubo-primary"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Enter your 10-digit mobile number</p>
                </div>

                <Alert className="bg-zubo-highlight-1 bg-opacity-10 border-zubo-highlight-1 border-opacity-30">
                  <Info className="h-4 w-4 text-zubo-primary" />
                  <AlertDescription className="text-zubo-text">
                    <strong>For Testing:</strong>
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
                  <Alert className="bg-zubo-accent bg-opacity-10 border-zubo-accent border-opacity-30">
                    <CheckCircle className="h-4 w-4 text-zubo-accent" />
                    <AlertDescription className="text-zubo-text">{success}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Send OTP
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Signing in as:{" "}
                    <span className="font-semibold text-zubo-text">
                      {userType === "pet_owner" ? "Pet Owner" : "Pet Sitter"}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-zubo-text font-medium">
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
                    className="text-center text-2xl tracking-widest focus:ring-zubo-primary focus:border-zubo-primary"
                  />
                  <p className="text-sm text-gray-500">Code sent to: +91 {phone}</p>
                </div>

                {demoOTP && (
                  <Alert
                    className={
                      fallbackMode
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-zubo-highlight-1 bg-opacity-10 border-zubo-highlight-1 border-opacity-30"
                    }
                  >
                    <Info className={`h-4 w-4 ${fallbackMode ? "text-yellow-600" : "text-zubo-primary"}`} />
                    <AlertDescription className={fallbackMode ? "text-yellow-700" : "text-zubo-text"}>
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>Your OTP:</strong> <span className="font-mono text-lg">{demoOTP}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copyOTPToInput}
                          className="ml-2 bg-transparent border-zubo-primary text-zubo-primary hover:bg-zubo-primary hover:text-white"
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
                  <Alert className="bg-zubo-accent bg-opacity-10 border-zubo-accent border-opacity-30">
                    <CheckCircle className="h-4 w-4 text-zubo-accent" />
                    <AlertDescription className="text-zubo-text">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-zubo-primary hover:text-zubo-highlight-2"
                  >
                    Didn't receive code? Resend OTP
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Verify & Sign In
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
                  className="w-full border-zubo-primary text-zubo-primary hover:bg-zubo-primary hover:text-white"
                >
                  Change Phone Number
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Your phone number is secure and will only be used for authentication</p>
          <p className="mt-1">💡 For testing: Use test OTP: 123456</p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              Powered by{" "}
              <a
                href="https://www.endgateglobal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zubo-primary hover:text-zubo-highlight-2 underline font-medium transition-colors"
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
