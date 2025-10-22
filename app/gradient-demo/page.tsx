"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Header } from "@/components/header"
import { Sparkles, Heart, Star, Zap, Camera, Users, Globe, Shield } from "lucide-react"

export default function GradientDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-flow mb-8 shadow-2xl gradient-glow">
              <Camera className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold gradient-text leading-tight">
              Gradient Experience
            </h1>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Immerse yourself in the beautiful world of gradient colors, animations, and stunning visual effects
            </p>
            <div className="flex justify-center gap-6 pt-4">
              <ThemeSwitcher />
              <Button className="gradient-button text-white px-8 py-3 text-lg font-semibold">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Exploring
              </Button>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Animated Gradient Card */}
            <Card className="gradient-card gradient-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-flow gradient-pulse flex items-center justify-center">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Animated Flow</CardTitle>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Experience the mesmerizing flow of gradient colors with smooth animations and beautiful transitions.
                </p>
              </CardContent>
            </Card>

            {/* Gradient Text Card */}
            <Card className="gradient-card gradient-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg gradient-text">Gradient Text</CardTitle>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Beautiful gradient text effects that flow through the signature color palette.
                </p>
              </CardContent>
            </Card>

            {/* Glow Effects Card */}
            <Card className="gradient-card gradient-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-secondary gradient-glow flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Glow Effects</CardTitle>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Stunning glow effects and shadows that create depth and visual interest throughout the interface.
                </p>
              </CardContent>
            </Card>

            {/* Interactive Elements Card */}
            <Card className="gradient-card gradient-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Interactive</CardTitle>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Interactive elements with hover effects, smooth transitions, and engaging user experiences.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Demo Section */}
          <div className="gradient-subtle rounded-3xl p-12 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold gradient-text">
                Interactive Demo
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Try out the gradient-themed components and see the beautiful effects in action
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Input Demo */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Styled Inputs</h3>
                <Input 
                  placeholder="Enter your handle..." 
                  className="gradient-input"
                />
                <Input 
                  placeholder="Your creative caption..." 
                  className="gradient-input"
                />
              </div>
              
              {/* Button Demo */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Gradient Buttons</h3>
                <div className="flex flex-col gap-3">
                  <Button className="gradient-button w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                  <Button className="gradient-primary w-full text-white">
                    <Heart className="mr-2 h-4 w-4" />
                    Like & Share
                  </Button>
                  <Button className="gradient-secondary w-full text-white">
                    <Globe className="mr-2 h-4 w-4" />
                    Explore More
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Badge Showcase */}
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold gradient-text">Gradient Badges</h2>
              <p className="text-xl text-muted-foreground">
                Beautiful badges with gradient-inspired colors and effects
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="gradient-accent text-white px-6 py-3 text-base font-semibold">
                <Camera className="mr-2 h-4 w-4" />
                Photography
              </Badge>
              <Badge className="gradient-primary text-white px-6 py-3 text-base font-semibold">
                <Heart className="mr-2 h-4 w-4" />
                Lifestyle
              </Badge>
              <Badge className="gradient-secondary text-white px-6 py-3 text-base font-semibold">
                <Globe className="mr-2 h-4 w-4" />
                Travel
              </Badge>
              <Badge className="gradient-subtle text-foreground px-6 py-3 text-base font-semibold border border-white/20">
                <Shield className="mr-2 h-4 w-4" />
                Verified
              </Badge>
            </div>
          </div>

          {/* Full Experience Section */}
          <div className="gradient-subtle rounded-3xl p-16 text-center space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-flow gradient-glow mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-5xl font-bold gradient-text leading-tight">
                Complete Gradient Experience
              </h2>
              <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                This entire section showcases the full gradient theme with subtle gradients, 
                beautiful animations, and stunning visual effects that create an immersive experience.
              </p>
            </div>
            <div className="flex justify-center gap-6 pt-6">
              <Button className="gradient-button text-white px-10 py-4 text-xl font-bold">
                <Camera className="mr-3 h-6 w-6" />
                Start Creating
              </Button>
              <Button className="gradient-primary text-white px-10 py-4 text-xl font-bold">
                <Users className="mr-3 h-6 w-6" />
                Join Community
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
