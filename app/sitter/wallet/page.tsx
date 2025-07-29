"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Smartphone,
} from "lucide-react"

interface WalletData {
  balance: number
  pendingAmount: number
  totalEarnings: number
  totalWithdrawn: number
  thisMonthEarnings: number
  lastWithdrawalAt: string | null
  paymentMethods: {
    bankAccount: {
      accountNumber: string
      ifscCode: string
      accountName: string
    } | null
    upiId: string | null
    preferredMethod: string
  }
  transactions: Transaction[]
  pendingWithdrawals: PendingWithdrawal[]
}

interface Transaction {
  id: string
  amount: number
  type: "earning" | "withdrawal" | "bonus" | "refund"
  status: "pending" | "completed" | "failed"
  description: string
  date: string
  availableAt?: string
  serviceDetails?: {
    date: string
    time: string
    serviceName: string
    petName: string
    ownerName: string
  }
}

interface PendingWithdrawal {
  id: string
  amount: number
  status: string
  paymentMethod: string
  requestedAt: string
  processedAt?: string
}

export default function SitterWalletPage() {
  const { sitter, user } = useAuth()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountName: "",
  })
  const [upiId, setUpiId] = useState("")
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)

  const userId = sitter?.userId || user?.id

  useEffect(() => {
    if (!userId) return

    const fetchWalletData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/sitters/wallet?userId=${userId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch wallet data")
        }

        const data = await response.json()
        setWalletData(data)

        // Pre-fill payment method details
        if (data.paymentMethods.bankAccount) {
          setBankDetails(data.paymentMethods.bankAccount)
        }
        if (data.paymentMethods.upiId) {
          setUpiId(data.paymentMethods.upiId)
        }
        setPaymentMethod(data.paymentMethods.preferredMethod || "bank_transfer")
      } catch (err) {
        console.error("Error fetching wallet data:", err)
        setError("Failed to load wallet data")
      } finally {
        setLoading(false)
      }
    }

    fetchWalletData()
  }, [userId])

  const handleWithdrawal = async () => {
    if (!walletData || !withdrawalAmount) return

    const amount = Number.parseFloat(withdrawalAmount)
    if (amount <= 0 || amount > walletData.balance) {
      alert("Invalid withdrawal amount")
      return
    }

    setWithdrawalLoading(true)

    try {
      const paymentDetails = paymentMethod === "bank_transfer" ? bankDetails : { upiId }

      const response = await fetch("/api/sitters/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount,
          paymentMethod,
          paymentDetails,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Withdrawal request submitted successfully! Processing time: ${result.estimatedProcessingTime}`)
        setWithdrawalDialogOpen(false)
        setWithdrawalAmount("")
        // Refresh wallet data
        window.location.reload()
      } else {
        alert(result.error || "Withdrawal failed")
      }
    } catch (err) {
      console.error("Withdrawal error:", err)
      alert("Withdrawal failed")
    } finally {
      setWithdrawalLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earning":
      case "bonus":
        return <ArrowDownRight className="h-4 w-4 text-green-500" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      default:
        return <Wallet className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !walletData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Wallet</h2>
          <p className="text-gray-600 mb-4">{error || "Failed to load wallet data"}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet</h1>
        <p className="text-gray-600">Manage your earnings and withdrawals</p>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{walletData.balance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₹{walletData.pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Processing (3-day hold)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{walletData.thisMonthEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current month earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{walletData.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Withdrawals */}
      {walletData.pendingWithdrawals.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Withdrawals</CardTitle>
            <CardDescription>Your withdrawal requests being processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {walletData.pendingWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">₹{withdrawal.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      Requested on {new Date(withdrawal.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(withdrawal.status)}>{withdrawal.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdraw Button */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Withdraw Funds</CardTitle>
            <CardDescription>Transfer your available balance to your bank account or UPI</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={walletData.balance <= 0} className="w-full sm:w-auto">
                  Withdraw ₹{walletData.balance.toFixed(2)}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>Available balance: ₹{walletData.balance.toFixed(2)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Withdrawal Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      max={walletData.balance}
                      min="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: ₹100</p>
                  </div>

                  <div>
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Bank Transfer
                          </div>
                        </SelectItem>
                        <SelectItem value="upi">
                          <div className="flex items-center">
                            <Smartphone className="h-4 w-4 mr-2" />
                            UPI
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === "bank_transfer" && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="account-number">Account Number</Label>
                        <Input
                          id="account-number"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                          placeholder="Enter account number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ifsc-code">IFSC Code</Label>
                        <Input
                          id="ifsc-code"
                          value={bankDetails.ifscCode}
                          onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                          placeholder="Enter IFSC code"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account-name">Account Holder Name</Label>
                        <Input
                          id="account-name"
                          value={bankDetails.accountName}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                          placeholder="Enter account holder name"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div>
                      <Label htmlFor="upi-id">UPI ID</Label>
                      <Input
                        id="upi-id"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="Enter UPI ID (e.g., user@paytm)"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleWithdrawal}
                    disabled={withdrawalLoading || !withdrawalAmount}
                    className="w-full"
                  >
                    {withdrawalLoading ? "Processing..." : "Submit Withdrawal Request"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {walletData.balance <= 0 && <p className="text-sm text-gray-500 mt-2">No funds available for withdrawal</p>}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent earnings and withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          {walletData.transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {walletData.transactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="text-sm text-gray-500">
                          <p>{new Date(transaction.date).toLocaleDateString()}</p>
                          {transaction.serviceDetails && (
                            <p>
                              {transaction.serviceDetails.serviceName} for {transaction.serviceDetails.petName}
                            </p>
                          )}
                          {transaction.availableAt && transaction.status === "pending" && (
                            <p>Available on {new Date(transaction.availableAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-lg font-semibold ${
                          transaction.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}₹{Math.abs(transaction.amount).toFixed(2)}
                      </span>
                      <Badge className={getStatusColor(transaction.status)}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{transaction.status}</span>
                      </Badge>
                    </div>
                  </div>
                  {index < walletData.transactions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
