import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  Shield,
  Clock,
  Star,
  Users,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  TwitterIcon as TikTok,
} from "lucide-react"

export default function HomePage() {
  const founders = [
    {
      name: "Jane Doe",
      bio: "Jane is a lifelong animal enthusiast with over 15 years of experience in pet care and animal welfare. She founded ZuboPets to create a reliable and compassionate community for pets and their owners.",
      imageUrl: "/placeholder.svg?height=100&width=100?query=Jane Doe portrait",
    },
    {
      name: "John Smith",
      bio: "John brings a strong background in technology and operations, ensuring ZuboPets runs smoothly and efficiently. His passion for pets drives his commitment to innovative solutions.",
      imageUrl: "/placeholder.svg?height=100&width=100?query=John Smith portrait",
    },
  ]

  const socialMediaLinks = [
    { name: "Facebook", icon: Facebook, url: "https://facebook.com/ZuboPets" },
    { name: "Twitter", icon: Twitter, url: "https://twitter.com/ZuboPets" },
    { name: "Instagram", icon: Instagram, url: "https://instagram.com/ZuboPets" },
    { name: "LinkedIn", icon: Linkedin, url: "https://linkedin.com/company/ZuboPets" },
    { name: "YouTube", icon: Youtube, url: "https://youtube.com/ZuboPets" },
    { name: "TikTok", icon: TikTok, url: "https://tiktok.com/@ZuboPets" },
  ]

  return (
    <div className="min-h-screen bg-zubo-background">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image src="/logo/zubo-logo.svg" alt="ZuboPets" width={120} height={40} className="h-8 w-auto" priority />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#services" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                Services
              </Link>
              <Link href="#about" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                About
              </Link>
              <Link href="#contact" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                Contact
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-zubo-primary text-zubo-primary hover:bg-zubo-primary hover:text-white bg-transparent"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zubo-primary/10 to-zubo-highlight-2/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <Image
                src="/logo/zubo-logo.svg"
                alt="ZuboPets"
                width={280}
                height={120}
                className="h-24 sm:h-28 md:h-32 lg:h-40 w-auto drop-shadow-lg"
                priority
              />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zubo-text mb-6 leading-tight">
              Your Pet's Best Friend,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zubo-primary to-zubo-highlight-2">
                Always
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with trusted, verified pet sitters and caretakers in your area. Professional pet care services
              that give you peace of mind and your pets the love they deserve.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Find Pet Care
                </Button>
              </Link>
              <Link href="/sitter">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-zubo-primary text-zubo-primary hover:bg-zubo-primary hover:text-white px-8 py-3 text-lg font-semibold bg-transparent"
                >
                  Become a Sitter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-zubo-text mb-4">Why Choose ZuboPets?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to providing the highest quality pet care services with complete transparency and trust.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-highlight-1/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-primary rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">Verified Sitters</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  All our pet sitters undergo thorough background checks and verification processes to ensure your pet's
                  safety.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-accent/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-highlight-2 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Round-the-clock customer support and emergency assistance whenever you need help with your bookings.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-highlight-2/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-accent rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">Loving Care</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Our sitters are passionate pet lovers who treat your furry friends like their own family members.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us Section (Founders) */}
      <section id="about" className="py-20 bg-zubo-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-zubo-text mb-4">Meet Our Founders</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The passionate individuals behind ZuboPets, dedicated to revolutionizing pet care.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {founders.map((founder, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-zubo-background"
              >
                <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
                  <Image
                    src={founder.imageUrl || "/placeholder.svg"}
                    alt={founder.name}
                    width={100}
                    height={100}
                    className="rounded-full object-cover w-24 h-24 sm:w-32 sm:h-32 border-4 border-zubo-highlight-1 shadow-md"
                  />
                  <div className="text-center sm:text-left">
                    <CardTitle className="text-2xl font-semibold text-zubo-primary mb-2">{founder.name}</CardTitle>
                    <CardDescription className="text-zubo-text leading-relaxed">{founder.bio}</CardDescription>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-zubo-text mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive pet care services tailored to meet your pet's unique needs and your busy schedule.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow bg-white border-0">
              <CardHeader>
                <div className="w-16 h-16 bg-zubo-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-zubo-text">Pet Sitting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  In-home pet sitting services to keep your pets comfortable in their familiar environment.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white border-0">
              <CardHeader>
                <div className="w-16 h-16 bg-zubo-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-zubo-text">Dog Walking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Regular dog walking services to keep your furry friend healthy, happy, and well-exercised.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white border-0">
              <CardHeader>
                <div className="w-16 h-16 bg-zubo-highlight-1 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-zubo-text">Pet Boarding</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Safe and comfortable boarding services in verified sitter homes for extended care periods.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white border-0">
              <CardHeader>
                <div className="w-16 h-16 bg-zubo-highlight-2 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-zubo-text">Special Care</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Specialized care for senior pets, puppies, or pets with special medical or behavioral needs.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-zubo-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-zubo-highlight-1">Happy Pets</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-zubo-highlight-1">Verified Sitters</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-zubo-highlight-1">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9★</div>
              <div className="text-zubo-highlight-1">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-zubo-primary to-zubo-highlight-2">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Ready to Give Your Pet the Best Care?</h2>
          <p className="text-xl text-zubo-highlight-1 mb-8 max-w-2xl mx-auto">
            Join thousands of pet parents who trust ZuboPets for their pet care needs. Get started today and find the
            perfect sitter for your furry friend.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-zubo-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                Book Pet Care Now
              </Button>
            </Link>
            <Link href="/sitter">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-zubo-primary px-8 py-3 text-lg font-semibold bg-transparent"
              >
                Become a Sitter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zubo-text text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="mb-6">
                <Image
                  src="/logo/zubo-logo.svg"
                  alt="ZuboPets"
                  width={160}
                  height={60}
                  className="h-12 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                Your trusted partner in pet care. Connecting loving pet owners with verified, professional pet sitters
                for peace of mind and exceptional care.
              </p>
              <div className="flex space-x-4">
                <Badge variant="secondary" className="bg-zubo-highlight-2 text-white">
                  Trusted by 10,000+ pet parents
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Find Pet Care
                  </Link>
                </li>
                <li>
                  <Link href="/sitter" className="hover:text-white transition-colors">
                    Become a Sitter
                  </Link>
                </li>
                <li>
                  <Link href="#services" className="hover:text-white transition-colors">
                    Our Services
                  </Link>
                </li>
                <li>
                  <Link href="#about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>support@zubopets.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Available in 50+ cities</span>
                </li>
              </ul>
              <h3 className="font-semibold text-lg mt-6 mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                {socialMediaLinks.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <Link
                      key={platform.name}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label={`Follow us on ${platform.name}`}
                    >
                      <Icon className="h-6 w-6" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ZuboPets. All rights reserved. Made with ❤️ for pet lovers everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
