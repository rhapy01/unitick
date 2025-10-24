"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Star, Heart, BarChart3 } from "lucide-react"
import DocsLayout from "@/components/docs-layout"

export default function FeedbackSystemPage() {
  return (
    <DocsLayout
      currentPath="/docs/feedback-system"
      title="Feedback System"
      icon={MessageSquare}
      previousPage={{ href: "/docs/free-tickets", title: "Free Ticket Support" }}
      nextPage={{ href: "/docs/vendor-system", title: "Vendor System Overview" }}
    >
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-lg text-muted-foreground mb-6">
              Rate vendors, leave comments, and help build a trusted ecosystem through community feedback.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Star className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Star Ratings</h3>
                    <p className="text-sm text-muted-foreground">Rate vendors 1-5 stars</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Heart className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Like/Dislike</h3>
                    <p className="text-sm text-muted-foreground">Quick thumbs up/down</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Comments</h3>
                    <p className="text-sm text-muted-foreground">Detailed feedback</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Vendor Stats</h3>
                    <p className="text-sm text-muted-foreground">Aggregated ratings</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Vendor Replies</h3>
                    <p className="text-sm text-muted-foreground">Response to feedback</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Star className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Verified Reviews</h3>
                    <p className="text-sm text-muted-foreground">From actual customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">How It Works</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h3 className="font-bold mb-2">Complete a Booking</h3>
                    <p className="text-muted-foreground">Only customers who have booked and received services can leave feedback</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h3 className="font-bold mb-2">Rate Your Experience</h3>
                    <p className="text-muted-foreground">Give a star rating (1-5) and optionally add a comment about your experience</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h3 className="font-bold mb-2">Help Others Decide</h3>
                    <p className="text-muted-foreground">Your feedback helps other customers make informed decisions</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">For Customers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Benefits</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Make informed decisions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Share your experience</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Help improve services</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Build community trust</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Guidelines</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Be honest and constructive</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Focus on service quality</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Avoid personal attacks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Respect privacy</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">For Vendors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Benefits</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Build reputation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Get customer insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Improve services</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Attract more customers</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Reply to reviews</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>View detailed analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Track rating trends</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Monitor feedback</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-6 border border-blue-800/50">
              <h3 className="font-bold mb-4 text-lg text-blue-300">Quality Assurance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-blue-200 font-semibold mb-2">Verified Reviews Only</div>
                  <p className="text-blue-300 mb-2">Only customers who have completed bookings can leave reviews</p>
                  <ul className="space-y-1 text-blue-400">
                    <li>• Prevents fake reviews</li>
                    <li>• Ensures authentic feedback</li>
                    <li>• Maintains platform integrity</li>
                  </ul>
                </div>
                <div>
                  <div className="text-blue-200 font-semibold mb-2">Moderation System</div>
                  <p className="text-blue-300 mb-2">Reviews are monitored for quality and appropriateness</p>
                  <ul className="space-y-1 text-blue-400">
                    <li>• Automated content filtering</li>
                    <li>• Community reporting system</li>
                    <li>• Manual review when needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  )
}