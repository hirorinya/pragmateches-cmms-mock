'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Wrench
} from 'lucide-react'

interface WorkOrder {
  id: string
  title: string
  description: string
  equipment_id: string
  equipment_name: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  assigned_to: string
  created_date: string
  due_date: string
  estimated_hours: number
  actual_hours?: number
  work_type: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY' | 'INSPECTION'
}

const mockWorkOrders: WorkOrder[] = [
  {
    id: 'WO-2024-001',
    title: 'Monthly PM - Heat Exchanger HX-101',
    description: 'Perform monthly preventive maintenance including inspection, cleaning, and lubrication.',
    equipment_id: 'HX-101',
    equipment_name: 'Heat Exchanger 101',
    priority: 'MEDIUM',
    status: 'OPEN',
    assigned_to: '保全チーム A',
    created_date: '2024-01-10',
    due_date: '2024-01-15',
    estimated_hours: 4,
    work_type: 'PREVENTIVE'
  },
  {
    id: 'WO-2024-002',
    title: 'Emergency Repair - Pump PU-102',
    description: 'Urgent repair required for abnormal vibration. Replace bearing assembly.',
    equipment_id: 'PU-102',
    equipment_name: 'Pump 102',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assigned_to: '保全チーム B',
    created_date: '2024-01-08',
    due_date: '2024-01-09',
    estimated_hours: 6,
    actual_hours: 4.5,
    work_type: 'EMERGENCY'
  },
  {
    id: 'WO-2024-003',
    title: 'Quarterly Inspection - Tank TK-201',
    description: 'Quarterly visual inspection and thickness measurement.',
    equipment_id: 'TK-201',
    equipment_name: 'Storage Tank 201',
    priority: 'LOW',
    status: 'COMPLETED',
    assigned_to: '保全チーム C',
    created_date: '2024-01-05',
    due_date: '2024-01-12',
    estimated_hours: 2,
    actual_hours: 2.5,
    work_type: 'INSPECTION'
  },
  {
    id: 'WO-2024-004',
    title: 'Oil Change - Compressor CP-301',
    description: 'Replace compressor oil and oil filter as per maintenance schedule.',
    equipment_id: 'CP-301',
    equipment_name: 'Air Compressor 301',
    priority: 'MEDIUM',
    status: 'OPEN',
    assigned_to: '保全チーム A',
    created_date: '2024-01-11',
    due_date: '2024-01-18',
    estimated_hours: 3,
    work_type: 'PREVENTIVE'
  },
  {
    id: 'WO-2024-005',
    title: 'Valve Replacement - Control Valve CV-105',
    description: 'Replace faulty control valve that is not maintaining proper pressure.',
    equipment_id: 'CV-105',
    equipment_name: 'Control Valve 105',
    priority: 'HIGH',
    status: 'OPEN',
    assigned_to: 'Unassigned',
    created_date: '2024-01-12',
    due_date: '2024-01-14',
    estimated_hours: 8,
    work_type: 'CORRECTIVE'
  }
]

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Wrench className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'COMPLETED' || status === 'CANCELLED') return false
    return new Date(dueDate) < new Date()
  }

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wo.equipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wo.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter
    const matchesPriority = priorityFilter === 'ALL' || wo.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const stats = {
    total: workOrders.length,
    open: workOrders.filter(wo => wo.status === 'OPEN').length,
    inProgress: workOrders.filter(wo => wo.status === 'IN_PROGRESS').length,
    overdue: workOrders.filter(wo => isOverdue(wo.due_date, wo.status)).length,
    high_priority: workOrders.filter(wo => wo.priority === 'HIGH' && wo.status !== 'COMPLETED').length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Work Orders</h1>
            <p className="text-muted-foreground">
              Manage and track maintenance work orders
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Work Order
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.open}</p>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-red-100 rounded-md flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.overdue}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-orange-100 rounded-md flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.high_priority}</p>
                  <p className="text-xs text-muted-foreground">High Priority</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search work orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <select 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Priority</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders List */}
        <div className="space-y-4">
          {filteredWorkOrders.map((workOrder) => (
            <Card key={workOrder.id} className={`${isOverdue(workOrder.due_date, workOrder.status) ? 'border-red-200 bg-red-50' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold">{workOrder.title}</h3>
                      {isOverdue(workOrder.due_date, workOrder.status) && (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          OVERDUE
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{workOrder.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Equipment</p>
                        <p className="text-muted-foreground">{workOrder.equipment_name} ({workOrder.equipment_id})</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Assigned To</p>
                        <p className="text-muted-foreground">{workOrder.assigned_to}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Due Date</p>
                        <p className="text-muted-foreground">
                          {new Date(workOrder.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Estimated Hours</p>
                        <p className="text-muted-foreground">
                          {workOrder.estimated_hours}h
                          {workOrder.actual_hours && ` (Actual: ${workOrder.actual_hours}h)`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex space-x-2">
                      <Badge className={getStatusColor(workOrder.status)}>
                        {getStatusIcon(workOrder.status)}
                        <span className="ml-1">{workOrder.status.replace('_', ' ')}</span>
                      </Badge>
                      
                      <Badge className={getPriorityColor(workOrder.priority)}>
                        {workOrder.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredWorkOrders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No work orders found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try adjusting your search filters.'
                  : 'Create your first work order to get started.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}