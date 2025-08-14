"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Zap } from "lucide-react"
import { Truck } from "lucide-react"
import { toast } from "sonner"

export function FleetMap() {
  const ambulances = [
    { id: "AMB-001", status: "deployed", location: "Downtown", lat: 40.7128, lng: -74.006 },
    { id: "AMB-007", status: "available", location: "Base Station", lat: 40.7589, lng: -73.9851 },
    { id: "AMB-012", status: "deployed", location: "Hospital", lat: 40.7505, lng: -73.9934 },
    { id: "AMB-015", status: "maintenance", location: "Service Center", lat: 40.7282, lng: -74.0776 },
  ]

  const handleNavigation = () => {
    toast.info("Navigation", {
      description: "GPS navigation feature will be available soon.",
    })
  }

  const handleCenterMap = () => {
    toast.info("Center Map", {
      description: "Map centered on fleet location.",
    })
  }

  const handleAmbulanceClick = (ambulance: any) => {
    toast.info(`${ambulance.id} Details`, {
      description: `Status: ${ambulance.status} | Location: ${ambulance.location}`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Fleet Location Map</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative bg-slate-100 rounded-lg h-96 overflow-hidden">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 300">
                {/* Street grid pattern */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          </div>

          {/* Ambulance Markers */}
          {ambulances.map((ambulance, index) => (
            <div
              key={ambulance.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: `${20 + index * 20}%`,
                top: `${30 + index * 15}%`,
              }}
              onClick={() => handleAmbulanceClick(ambulance)}
            >
              <div
                className={`relative p-2 rounded-full shadow-lg transition-transform group-hover:scale-110 ${
                  ambulance.status === "deployed"
                    ? "bg-red-500"
                    : ambulance.status === "available"
                      ? "bg-green-500"
                      : "bg-orange-500"
                }`}
              >
                <Truck className="h-4 w-4 text-white" /> {/* Truck component used here */}
                {ambulance.status === "deployed" && (
                  <div className="absolute -top-1 -right-1">
                    <Zap className="h-3 w-3 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  <div className="font-medium">{ambulance.id}</div>
                  <div className="text-gray-300">{ambulance.location}</div>
                  <Badge
                    variant="secondary"
                    className={`mt-1 text-xs ${
                      ambulance.status === "deployed"
                        ? "bg-red-100 text-red-800"
                        : ambulance.status === "available"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {ambulance.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}

          {/* Map Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <button
              className="bg-white p-2 rounded shadow hover:shadow-md transition-shadow"
              onClick={handleNavigation}
            >
              <Navigation className="h-4 w-4" />
            </button>
            <button className="bg-white p-2 rounded shadow hover:shadow-md transition-shadow" onClick={handleCenterMap}>
              <MapPin className="h-4 w-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow">
            <div className="text-xs font-medium mb-2">Status Legend</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs">Deployed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-xs">Maintenance</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
