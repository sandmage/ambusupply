"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Save,
  Eye,
  FileText,
  CheckSquare,
  List,
  Wrench,
  Package,
  Shield,
} from "lucide-react"

interface ChecklistItem {
  id: string
  type: "checkbox" | "text" | "number" | "select" | "textarea"
  label: string
  description?: string
  required: boolean
  category: "equipment" | "inventory" | "safety" | "maintenance" | "other"
  options?: string[]
  order: number
}

interface DailyCheckForm {
  id?: string
  name: string
  description: string
  vehicle_types: string[]
  checklist_items: ChecklistItem[]
  is_active: boolean
  created_by?: string
  organization_id?: string
}

interface Vehicle {
  id: string
  vehicle_number: string
  vehicle_type: string
}

export function DailyCheckFormBuilder() {
  const [forms, setForms] = useState<DailyCheckForm[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedForm, setSelectedForm] = useState<DailyCheckForm | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch existing forms
      const { data: formsData } = await supabase
        .from("daily_check_forms")
        .select("*")
        .order("created_at", { ascending: false })

      // Fetch vehicles for form assignment
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("id, vehicle_number, vehicle_type")
        .eq("status", "active")
        .order("vehicle_number")

      setForms(formsData || [])
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createNewForm = () => {
    const newForm: DailyCheckForm = {
      name: "New Daily Check Form",
      description: "",
      vehicle_types: [],
      checklist_items: [],
      is_active: true,
    }
    setSelectedForm(newForm)
    setIsEditing(true)
  }

  const saveForm = async () => {
    if (!selectedForm) return

    try {
      const formData = {
        ...selectedForm,
        updated_at: new Date().toISOString(),
      }

      if (selectedForm.id) {
        // Update existing form
        const { error } = await supabase.from("daily_check_forms").update(formData).eq("id", selectedForm.id)

        if (error) throw error
      } else {
        // Create new form
        const { data, error } = await supabase.from("daily_check_forms").insert([formData]).select().single()

        if (error) throw error
        setSelectedForm(data)
      }

      setIsEditing(false)
      fetchData()
    } catch (error) {
      console.error("Error saving form:", error)
    }
  }

  const addChecklistItem = (item: ChecklistItem) => {
    if (!selectedForm) return

    const newItems = [...selectedForm.checklist_items, item]
    setSelectedForm({
      ...selectedForm,
      checklist_items: newItems,
    })
    setShowItemDialog(false)
    setEditingItem(null)
  }

  const updateChecklistItem = (updatedItem: ChecklistItem) => {
    if (!selectedForm) return

    const newItems = selectedForm.checklist_items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    setSelectedForm({
      ...selectedForm,
      checklist_items: newItems,
    })
    setShowItemDialog(false)
    setEditingItem(null)
  }

  const removeChecklistItem = (itemId: string) => {
    if (!selectedForm) return

    const newItems = selectedForm.checklist_items.filter((item) => item.id !== itemId)
    setSelectedForm({
      ...selectedForm,
      checklist_items: newItems,
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "equipment":
        return <Wrench className="h-4 w-4" />
      case "inventory":
        return <Package className="h-4 w-4" />
      case "safety":
        return <Shield className="h-4 w-4" />
      case "maintenance":
        return <Settings className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "equipment":
        return "bg-primary/10 text-primary"
      case "inventory":
        return "bg-secondary/10 text-secondary"
      case "safety":
        return "bg-destructive/10 text-destructive"
      case "maintenance":
        return "bg-accent/10 text-accent"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading form builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Daily Check Form Builder</h2>
          <p className="text-muted-foreground">Create and manage customizable vehicle inspection forms</p>
        </div>
        <Button onClick={createNewForm} className="apple-button">
          <Plus className="h-4 w-4 mr-2" />
          Create New Form
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forms List */}
        <Card className="apple-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Existing Forms
            </CardTitle>
            <CardDescription>Select a form to edit or create a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {forms.map((form) => (
              <div
                key={form.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedForm?.id === form.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onClick={() => {
                  setSelectedForm(form)
                  setIsEditing(false)
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{form.name}</h4>
                    <p className="text-sm text-muted-foreground">{form.checklist_items.length} items</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {form.is_active ? (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {forms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No forms created yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Editor */}
        <div className="lg:col-span-2">
          {selectedForm ? (
            <Card className="apple-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{isEditing ? "Edit Form" : selectedForm.name}</CardTitle>
                    <CardDescription>
                      {isEditing ? "Modify form settings and checklist items" : "View form details"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl">
                          <Settings className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl">
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveForm} className="apple-button">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="settings" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 rounded-xl">
                    <TabsTrigger value="settings" className="rounded-lg">
                      Form Settings
                    </TabsTrigger>
                    <TabsTrigger value="items" className="rounded-lg">
                      Checklist Items
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="form-name">Form Name</Label>
                        <Input
                          id="form-name"
                          value={selectedForm.name}
                          onChange={(e) =>
                            setSelectedForm({
                              ...selectedForm,
                              name: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                          className="apple-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="form-description">Description</Label>
                        <Textarea
                          id="form-description"
                          value={selectedForm.description}
                          onChange={(e) =>
                            setSelectedForm({
                              ...selectedForm,
                              description: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                          className="apple-input min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Vehicle Types</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {["ambulance", "support_vehicle", "supervisor_vehicle", "transport"].map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={type}
                                checked={selectedForm.vehicle_types.includes(type)}
                                onChange={(e) => {
                                  const newTypes = e.target.checked
                                    ? [...selectedForm.vehicle_types, type]
                                    : selectedForm.vehicle_types.filter((t) => t !== type)
                                  setSelectedForm({
                                    ...selectedForm,
                                    vehicle_types: newTypes,
                                  })
                                }}
                                disabled={!isEditing}
                                className="rounded"
                              />
                              <Label htmlFor={type} className="text-sm capitalize">
                                {type.replace("_", " ")}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is-active"
                          checked={selectedForm.is_active}
                          onCheckedChange={(checked) =>
                            setSelectedForm({
                              ...selectedForm,
                              is_active: checked,
                            })
                          }
                          disabled={!isEditing}
                        />
                        <Label htmlFor="is-active">Active Form</Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="items" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Checklist Items</h4>
                      {isEditing && (
                        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="apple-button">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Item
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <ChecklistItemForm
                              item={editingItem}
                              onSave={editingItem ? updateChecklistItem : addChecklistItem}
                              onCancel={() => {
                                setShowItemDialog(false)
                                setEditingItem(null)
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    <div className="space-y-3">
                      {selectedForm.checklist_items
                        .sort((a, b) => a.order - b.order)
                        .map((item) => (
                          <div key={item.id} className="form-builder-item flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(item.category)}
                                <Badge className={`text-xs ${getCategoryColor(item.category)}`}>{item.category}</Badge>
                              </div>
                              <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.type} • {item.required ? "Required" : "Optional"}
                                </p>
                              </div>
                            </div>
                            {isEditing && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(item)
                                    setShowItemDialog(true)
                                  }}
                                  className="rounded-lg"
                                >
                                  <Settings className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeChecklistItem(item.id)}
                                  className="rounded-lg text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      {selectedForm.checklist_items.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No checklist items added yet</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="apple-card">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-medium mb-2">No Form Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Select an existing form or create a new one to get started
                  </p>
                  <Button onClick={createNewForm} className="apple-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Checklist Item Form Component
function ChecklistItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: ChecklistItem | null
  onSave: (item: ChecklistItem) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<ChecklistItem>(
    item || {
      id: crypto.randomUUID(),
      type: "checkbox",
      label: "",
      description: "",
      required: false,
      category: "equipment",
      options: [],
      order: 0,
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle>{item ? "Edit Checklist Item" : "Add Checklist Item"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="item-type">Item Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="number">Number Input</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-label">Label</Label>
          <Input
            id="item-label"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="e.g., Check oxygen tank pressure"
            className="apple-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-description">Description (Optional)</Label>
          <Textarea
            id="item-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Additional instructions or details"
            className="apple-input"
          />
        </div>

        {formData.type === "select" && (
          <div className="space-y-2">
            <Label>Options (one per line)</Label>
            <Textarea
              value={formData.options?.join("\n") || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  options: e.target.value.split("\n").filter((opt) => opt.trim()),
                })
              }
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              className="apple-input"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="item-required"
            checked={formData.required}
            onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
          />
          <Label htmlFor="item-required">Required Field</Label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="apple-button flex-1">
            <Save className="h-4 w-4 mr-2" />
            {item ? "Update Item" : "Add Item"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl bg-transparent">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
