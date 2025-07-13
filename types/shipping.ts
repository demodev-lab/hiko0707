export interface ShippingTracking {
  id: string
  orderId: string
  userId: string
  status: 'pending_pickup' | 'picked_up' | 'in_transit' | 'customs_processing' | 'out_for_delivery' | 'delivered' | 'failed'
  domesticCarrier: string
  domesticTrackingNumber: string
  internationalCarrier?: string
  internationalTrackingNumber?: string
  estimatedDelivery: Date
  lastUpdated: Date
  deliveredAt?: Date
  events: TrackingEvent[]
}

export interface TrackingEvent {
  timestamp: Date
  status: string
  description: string
  location: string
}

export interface ShippingAutomationStats {
  activeShipments: number
  deliveredToday: number
  inTransit: number
  pendingPickup: number
  customsProcessing: number
  avgDeliveryTime: number
  onTimeDeliveryRate: number
  totalProcessed: number
}