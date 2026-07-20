'use client'

import { AlertTriangle, Image, FileText, DollarSign } from 'lucide-react'

interface Alert {
  id: string
  type: 'photos' | 'price' | 'description' | 'title'
  message: string
  listing?: string
}

interface RevendaAlertsProps {
  alerts: Alert[]
}

const alertIcons = {
  photos: Image,
  price: DollarSign,
  description: FileText,
  title: AlertTriangle,
}

export default function RevendaAlerts({ alerts }: RevendaAlertsProps) {
  if (alerts.length === 0) return null

  return (
    <div className="revenda-alerts">
      <h3 className="revenda-alerts-title">Alertas</h3>
      <div className="revenda-alerts-list">
        {alerts.map(alert => {
          const Icon = alertIcons[alert.type]
          return (
            <div key={alert.id} className="revenda-alert-item">
              <Icon size={16} className="revenda-alert-icon" />
              <div className="revenda-alert-content">
                <span className="revenda-alert-message">{alert.message}</span>
                {alert.listing && <span className="revenda-alert-listing">{alert.listing}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
