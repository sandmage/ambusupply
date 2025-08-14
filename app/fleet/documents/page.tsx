"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Calendar, AlertTriangle, CheckCircle, Upload, Download, Edit, Plus, Search } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function FleetDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const vehicles = [
    {
      id: "AMB-001",
      type: "Advanced Life Support",
      insurance: {
        provider: "State Farm Commercial",
        policyNumber: "SF-AMB-001-2024",
        expiryDate: "2024-12-15",
        premium: "$4,200/year",
        status: "active",
        daysUntilExpiry: 320,
      },
      registration: {
        state: "CA",
        plateNumber: "AMB001CA",
        expiryDate: "2024-11-30",
        registrationNumber: "REG-AMB-001-CA",
        status: "active",
        daysUntilExpiry: 305,
      },
      inspection: {
        lastInspection: "2024-01-10",
        nextInspection: "2024-07-10",
        inspector: "DOT Inspector #1234",
        status: "passed",
        daysUntilNext: 156,
      },
    },
    {
      id: "AMB-007",
      type: "Basic Life Support",
      insurance: {
        provider: "Allstate Commercial",
        policyNumber: "AS-AMB-007-2024",
        expiryDate: "2024-03-20",
        premium: "$3,800/year",
        status: "expiring-soon",
        daysUntilExpiry: 25,
      },
      registration: {
        state: "CA",
        plateNumber: "AMB007CA",
        expiryDate: "2024-02-15",
        registrationNumber: "REG-AMB-007-CA",
        status: "expired",
        daysUntilExpiry: -30,
      },
      inspection: {
        lastInspection: "2023-12-05",
        nextInspection: "2024-06-05",
        inspector: "DOT Inspector #5678",
        status: "passed",
        daysUntilNext: 121,
      },
    },
    {
      id: "AMB-012",
      type: "Critical Care",
      insurance: {
        provider: "Progressive Commercial",
        policyNumber: "PG-AMB-012-2024",
        expiryDate: "2024-08-30",
        premium: "$5,100/year",
        status: "active",
        daysUntilExpiry: 227,
      },
      registration: {
        state: "CA",
        plateNumber: "AMB012CA",
        expiryDate: "2024-07-22",
        registrationNumber: "REG-AMB-012-CA",
        status: "active",
        daysUntilExpiry: 188,
      },
      inspection: {
        lastInspection: "2024-01-12",
        nextInspection: "2024-07-12",
        inspector: "DOT Inspector #9012",
        status: "passed",
        daysUntilNext: 158,
      },
    },
  ]

  const getStatusBadge = (status: string, daysUntil: number) => {
    if (status === "expired" || daysUntil < 0) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>
    }
    if (status === "expiring-soon" || daysUntil <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  }

  const getStatusColor = (status: string, daysUntil: number) => {
    if (status === "expired" || daysUntil < 0) return "text-red-600"
    if (status === "expiring-soon" || daysUntil <= 30) return "text-yellow-600"
    return "text-green-600"
  }

  const handleUploadDocument = (vehicleId: string, docType: string) => {
    toast.info(`Upload ${docType}`, {
      description: `Document upload for ${vehicleId} will open here. Feature in development.`,
    })
  }

  const handleDownloadDocument = (vehicleId: string, docType: string) => {
    toast.info(`Download ${docType}`, {
      description: `Downloading ${docType} for ${vehicleId}...`,
    })
  }

  const handleEditDocument = (vehicleId: string, docType: string) => {
    toast.info(`Edit ${docType}`, {
      description: `Edit form for ${vehicleId} ${docType} will open here. Feature in development.`,
    })
  }

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getExpiringDocuments = () => {
    const expiring = []
    vehicles.forEach((vehicle) => {
      if (vehicle.insurance.daysUntilExpiry <= 30) {
        expiring.push({ vehicle: vehicle.id, type: "Insurance", days: vehicle.insurance.daysUntilExpiry })
      }
      if (vehicle.registration.daysUntilExpiry <= 30) {
        expiring.push({ vehicle: vehicle.id, type: "Registration", days: vehicle.registration.daysUntilExpiry })
      }
      if (vehicle.inspection.daysUntilNext <= 30) {
        expiring.push({ vehicle: vehicle.id, type: "Inspection", days: vehicle.inspection.daysUntilNext })
      }
    })
    return expiring
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fleet Documents & Compliance</h1>
          <p className="text-muted-foreground mt-1">Manage insurance, registration, and inspection records</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Card className="lg:w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>Expiring Soon</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getExpiringDocuments().map((doc, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="font-medium">
                    {doc.vehicle} {doc.type}
                  </span>
                  <span
                    className={`${doc.days < 0 ? "text-red-600" : doc.days <= 7 ? "text-red-600" : "text-yellow-600"}`}
                  >
                    {doc.days < 0 ? `${Math.abs(doc.days)} days overdue` : `${doc.days} days`}
                  </span>
                </div>
              ))}
              {getExpiringDocuments().length === 0 && (
                <div className="text-sm text-muted-foreground flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>All documents current</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="registration">Registration</TabsTrigger>
          <TabsTrigger value="inspection">Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span>{vehicle.id}</span>
                    <Badge variant="outline">{vehicle.type}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Insurance Card */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Insurance</span>
                      </h4>
                      {getStatusBadge(vehicle.insurance.status, vehicle.insurance.daysUntilExpiry)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-medium ml-2">{vehicle.insurance.provider}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <span
                          className={`font-medium ml-2 ${getStatusColor(vehicle.insurance.status, vehicle.insurance.daysUntilExpiry)}`}
                        >
                          {vehicle.insurance.expiryDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Premium:</span>
                        <span className="font-medium ml-2">{vehicle.insurance.premium}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditDocument(vehicle.id, "insurance")}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleUploadDocument(vehicle.id, "insurance")}>
                        <Upload className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(vehicle.id, "insurance")}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Registration Card */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Registration</span>
                      </h4>
                      {getStatusBadge(vehicle.registration.status, vehicle.registration.daysUntilExpiry)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Plate:</span>
                        <span className="font-medium ml-2">{vehicle.registration.plateNumber}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <span
                          className={`font-medium ml-2 ${getStatusColor(vehicle.registration.status, vehicle.registration.daysUntilExpiry)}`}
                        >
                          {vehicle.registration.expiryDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">State:</span>
                        <span className="font-medium ml-2">{vehicle.registration.state}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditDocument(vehicle.id, "registration")}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUploadDocument(vehicle.id, "registration")}
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadDocument(vehicle.id, "registration")}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Inspection Card */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Inspection</span>
                      </h4>
                      {getStatusBadge(vehicle.inspection.status, vehicle.inspection.daysUntilNext)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Last:</span>
                        <span className="font-medium ml-2">{vehicle.inspection.lastInspection}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Due:</span>
                        <span
                          className={`font-medium ml-2 ${getStatusColor(vehicle.inspection.status, vehicle.inspection.daysUntilNext)}`}
                        >
                          {vehicle.inspection.nextInspection}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Inspector:</span>
                        <span className="font-medium ml-2">{vehicle.inspection.inspector}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditDocument(vehicle.id, "inspection")}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleUploadDocument(vehicle.id, "inspection")}>
                        <Upload className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadDocument(vehicle.id, "inspection")}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="insurance">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">{vehicle.id}</span>
                        {getStatusBadge(vehicle.insurance.status, vehicle.insurance.daysUntilExpiry)}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditDocument(vehicle.id, "insurance")}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(vehicle.id, "insurance")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Provider:</span>
                        <div className="font-medium">{vehicle.insurance.provider}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Policy Number:</span>
                        <div className="font-medium">{vehicle.insurance.policyNumber}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expiry Date:</span>
                        <div
                          className={`font-medium ${getStatusColor(vehicle.insurance.status, vehicle.insurance.daysUntilExpiry)}`}
                        >
                          {vehicle.insurance.expiryDate}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Premium:</span>
                        <div className="font-medium">{vehicle.insurance.premium}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration">
          <Card>
            <CardHeader>
              <CardTitle>Registration Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">{vehicle.id}</span>
                        {getStatusBadge(vehicle.registration.status, vehicle.registration.daysUntilExpiry)}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDocument(vehicle.id, "registration")}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(vehicle.id, "registration")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Plate Number:</span>
                        <div className="font-medium">{vehicle.registration.plateNumber}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Registration #:</span>
                        <div className="font-medium">{vehicle.registration.registrationNumber}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expiry Date:</span>
                        <div
                          className={`font-medium ${getStatusColor(vehicle.registration.status, vehicle.registration.daysUntilExpiry)}`}
                        >
                          {vehicle.registration.expiryDate}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">State:</span>
                        <div className="font-medium">{vehicle.registration.state}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspection">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">{vehicle.id}</span>
                        {getStatusBadge(vehicle.inspection.status, vehicle.inspection.daysUntilNext)}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDocument(vehicle.id, "inspection")}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(vehicle.id, "inspection")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Last Inspection:</span>
                        <div className="font-medium">{vehicle.inspection.lastInspection}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Due:</span>
                        <div
                          className={`font-medium ${getStatusColor(vehicle.inspection.status, vehicle.inspection.daysUntilNext)}`}
                        >
                          {vehicle.inspection.nextInspection}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Inspector:</span>
                        <div className="font-medium">{vehicle.inspection.inspector}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="font-medium capitalize">{vehicle.inspection.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
