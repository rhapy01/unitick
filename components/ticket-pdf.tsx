import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { Order, Booking } from "@/lib/types"
import { SERVICE_TYPES } from "@/lib/constants"

// Create styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 25,
    borderBottom: '2 solid #3B82F6',
    paddingBottom: 15,
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 8,
    border: '1 solid #E2E8F0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 20,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '12 24',
    borderRadius: 25,
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'center',
    boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
  },
  giftBadge: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    padding: '8 20',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 10,
    boxShadow: '0 3px 6px rgba(245, 158, 11, 0.3)',
  },
  giftText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  qrSection: {
    textAlign: 'center',
    marginBottom: 25,
    backgroundColor: '#F1F5F9',
    padding: 15,
    borderRadius: 8,
    border: '1 solid #E2E8F0',
  },
  qrCode: {
    width: 120,
    height: 120,
    marginBottom: 10,
    alignSelf: 'center',
    border: '2 solid #3B82F6',
    borderRadius: 8,
    padding: 3,
    backgroundColor: '#FFFFFF',
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  qrDescription: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  nftSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#F0F9FF',
    border: '2 solid #0EA5E9',
    borderRadius: 8,
  },
  nftTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C4A6E',
    marginBottom: 8,
    textAlign: 'center',
  },
  nftInfo: {
    marginBottom: 6,
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    border: '1 solid #0EA5E9',
  },
  nftLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C4A6E',
    marginBottom: 2,
  },
  nftContract: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Courier',
  },
  nftDescription: {
    fontSize: 11,
    color: '#0C4A6E',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 18,
    borderBottom: '2 solid #3B82F6',
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
    padding: '12 16',
    borderRadius: 8,
    border: '1 solid #E2E8F0',
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  column: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 10,
    border: '1 solid #E2E8F0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  valueGreen: {
    fontSize: 13,
    color: '#059669',
    fontWeight: 'bold',
  },
  valueMono: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  statusTag: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '2 8',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 'bold',
  },
  bookingCard: {
    border: '2 solid #3B82F6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottom: '2 solid #E2E8F0',
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  serviceTypeBadge: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    padding: '6 12',
    borderRadius: 15,
    fontSize: 11,
    fontWeight: 'bold',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bookingColumn: {
    width: '48%',
  },
  bookingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  bookingLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  bookingValue: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  bookingValueGreen: {
    fontSize: 11,
    color: '#059669',
    fontWeight: 'bold',
  },
  vendorSection: {
    borderTop: '1 solid #D1D5DB',
    paddingTop: 10,
  },
  vendorTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  vendorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  vendorLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  vendorValue: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  noticeBox: {
    backgroundColor: '#E0F2FE',
    border: '2 solid #0EA5E9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 18,
    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.2)',
  },
  noticeText: {
    fontSize: 13,
    color: '#0C4A6E',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    border: '2 solid #F59E0B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 18,
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  footer: {
    textAlign: 'center',
    marginTop: 40,
    paddingTop: 25,
    borderTop: '3 solid #3B82F6',
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 10,
    border: '1 solid #E2E8F0',
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  transactionHash: {
    fontSize: 10,
    color: '#1F2937',
    fontFamily: 'Courier',
    wordBreak: 'break-all',
    marginTop: 3,
  },
})

interface TicketPDFProps {
  order: Order
  bookings: Array<Booking & {
    listing: {
      title: string
      service_type: string
      location: string
      price: number
      images: string[]
    }
    vendor: {
      business_name: string
      contact_email: string
      phone?: string
      physical_address: string
    }
  }>
  customer: { name: string; email: string }
  buyer?: { name: string; email: string }
  qrCodeUrl: string
}

export const TicketPDF = ({ order, bookings, customer, buyer, qrCodeUrl }: TicketPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>UniTick</Text>
        <Text style={styles.subtitle}>Event Ticket</Text>
        {bookings.some(booking => booking.is_gift) && (
          <View style={styles.giftBadge}>
            <Text style={styles.giftText}>🎁 GIFT TICKET</Text>
          </View>
        )}
        <View style={styles.statusBadge}>
          <Text>CONFIRMED</Text>
        </View>
      </View>

      {/* QR Code Section */}
      <View style={styles.qrSection}>
        <Image style={styles.qrCode} src={qrCodeUrl} />
        <Text style={styles.qrLabel}>QR Code</Text>
        <Text style={styles.qrDescription}>Scan this code for verification</Text>
        
        {/* NFT Information */}
        {bookings.some(booking => booking.nft_contract_address && booking.nft_token_id) && (
          <View style={styles.nftSection}>
            <Text style={styles.nftTitle}>Blockchain Verification</Text>
            {bookings
              .filter(booking => booking.nft_contract_address && booking.nft_token_id)
              .map((booking, index) => (
                <View key={index} style={styles.nftInfo}>
                  <Text style={styles.nftLabel}>NFT Token ID: {booking.nft_token_id}</Text>
                  <Text style={styles.nftContract}>Contract: {booking.nft_contract_address?.slice(0, 10)}...{booking.nft_contract_address?.slice(-8)}</Text>
                </View>
              ))
            }
            <Text style={styles.nftDescription}>Verify ownership on blockchain for ultimate security</Text>
          </View>
        )}
      </View>

      {/* Order Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.row}>
              <Text style={styles.label}>Order ID:</Text>
              <Text style={styles.valueMono}>{order.id.slice(0, 8)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Amount:</Text>
              <Text style={styles.valueGreen}>${order.total_amount.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Platform Fee:</Text>
              <Text style={styles.value}>${order.platform_fee_total.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Purchase Date:</Text>
              <Text style={styles.value}>{new Date(order.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <View style={styles.statusTag}>
                <Text>{order.status.toUpperCase()}</Text>
              </View>
            </View>
            {order.transaction_hash && order.transaction_hash !== 'contract_29' && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Transaction ID:</Text>
                <Text style={styles.transactionHash}>{order.transaction_hash}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{customer.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{customer.email}</Text>
        </View>
        {bookings.some(booking => booking.is_gift && booking.gift_message) && (
          <View style={styles.row}>
            <Text style={styles.label}>Gift Message:</Text>
            <Text style={styles.value}>{bookings.find(booking => booking.is_gift && booking.gift_message)?.gift_message}</Text>
          </View>
        )}
      </View>

      {/* Buyer Information */}
      {buyer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchased By</Text>
          <View style={styles.infoCard}>
            <View style={styles.row}>
              <Text style={styles.label}>Buyer Name:</Text>
              <Text style={styles.value}>{buyer.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Buyer Email:</Text>
              <Text style={styles.value}>{buyer.email}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Bookings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bookings ({bookings.length})</Text>
        {bookings.map((booking, index) => (
          <View key={index} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingTitle}>{booking.listing?.title || 'Unknown Service'}</Text>
              <View style={styles.serviceTypeBadge}>
                <Text>{SERVICE_TYPES[booking.listing?.service_type || "event"]}</Text>
              </View>
            </View>
            
            <View style={styles.bookingDetails}>
              <View style={styles.bookingColumn}>
                <Text style={styles.bookingSubtitle}>Service Details:</Text>
                <View style={styles.bookingRow}>
                  <Text style={styles.bookingLabel}>Qty:</Text>
                  <Text style={styles.bookingValue}>{booking.quantity}</Text>
                </View>
                <View style={styles.bookingRow}>
                  <Text style={styles.bookingLabel}>Price:</Text>
                  <Text style={styles.bookingValue}>${booking.listing?.price?.toFixed(2) || '0.00'}</Text>
                </View>
                <View style={styles.bookingRow}>
                  <Text style={styles.bookingLabel}>Total:</Text>
                  <Text style={styles.bookingValueGreen}>${booking.total_amount.toFixed(2)}</Text>
                </View>
              </View>
              
              <View style={styles.bookingColumn}>
                <Text style={styles.bookingSubtitle}>Event Details:</Text>
                <View style={styles.bookingRow}>
                  <Text style={styles.bookingLabel}>Date:</Text>
                  <Text style={styles.bookingValue}>{new Date(booking.booking_date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.bookingRow}>
                  <Text style={styles.bookingLabel}>Location:</Text>
                  <Text style={styles.bookingValue}>{booking.listing?.location || 'Unknown Location'}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.vendorSection}>
              <Text style={styles.vendorTitle}>Service Provider:</Text>
              <View style={styles.vendorRow}>
                <Text style={styles.vendorLabel}>Business Name:</Text>
                <Text style={styles.vendorValue}>{booking.vendor?.business_name || 'Unknown Vendor'}</Text>
              </View>
              <View style={styles.vendorRow}>
                <Text style={styles.vendorLabel}>Contact Email:</Text>
                <Text style={styles.vendorValue}>{booking.vendor?.contact_email || 'Unknown Email'}</Text>
              </View>
              {booking.vendor?.phone && (
                <View style={styles.vendorRow}>
                  <Text style={styles.vendorLabel}>Phone:</Text>
                  <Text style={styles.vendorValue}>{booking.vendor.phone}</Text>
                </View>
              )}
              <View style={styles.vendorRow}>
                <Text style={styles.vendorLabel}>Business Address:</Text>
                <Text style={styles.vendorValue}>{booking.vendor?.physical_address || 'Address not provided'}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Verification Instructions */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          Ticket Verification: Order ID {order.id.slice(0, 8)} • Customer: {customer.name}
        </Text>
      </View>
      
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          Show this ticket to the vendor when you arrive for service.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Generated by UniTick • {new Date().toLocaleString()}
        </Text>
      </View>
    </Page>
  </Document>
)
