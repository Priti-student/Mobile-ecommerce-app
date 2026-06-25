import { useRef } from 'react'
import type { CartItem } from '@/context/CartContext'
import { getPrimaryImage } from '@/types/product'
import { formatPrice } from '@/lib/api'

interface BillModalProps {
  items: CartItem[]
  userName: string
  shopName: string
  onClose: () => void
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  if (hour < 21) return 'Good Evening'
  return 'Good Night'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export function BillModal({ items, userName, shopName, onClose }: BillModalProps) {
  const billRef = useRef<HTMLDivElement>(null)
  const now = new Date()
  const greeting = getGreeting()
  const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`

  const grandPrintedTotal = items.reduce(
    (sum, item) => sum + (item.product.printedPrice || item.product.price) * item.quantity,
    0,
  )
  const grandSellingTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )
  const grandSavings = grandPrintedTotal - grandSellingTotal
  const hasSavings = grandSavings > 0

  function handlePrint() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const billContent = billRef.current?.cloneNode(true) as HTMLElement | null
    if (!billContent) return

    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules || [])
            .map((rule) => rule.cssText)
            .join('\n')
        } catch {
          return ''
        }
      })
      .join('\n')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${shopName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700&display=swap');
          ${styles}
          body { margin: 0; padding: 40px; font-family: 'Inter', sans-serif; background: #f8f9fa; }
          @media print {
            body { padding: 0; background: white; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div style="max-width: 800px; margin: 0 auto; position: relative;">
          <button onclick="window.print()" class="no-print" style="position: fixed; top: 20px; right: 20px; z-index: 999; padding: 10px 24px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(37,99,235,0.4); transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print / Save PDF
          </button>
          ${billContent.innerHTML}
        </div>
        <script>
          // Wait for fonts and images to load, then auto-print
          window.onload = function() { setTimeout(function() { window.print(); }, 500); };
        </script>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[95vh] w-full max-w-[820px] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Download Button - Top Right */}
        <div className="sticky top-0 z-10 flex items-center justify-end border-b border-gray-100 bg-white/95 px-6 py-3 backdrop-blur-sm">
          <span className="mr-auto text-xs font-medium text-gray-400">Invoice Preview</span>
          <button
            type="button"
            onClick={handlePrint}
            className="no-print inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Download / Print PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="no-print ml-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Bill Content */}
        <div ref={billRef} className="p-6 sm:p-10 lg:p-12">
          {/* Header: Shop Name Left, Logo Right */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-['Playfair_Display',serif] text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                {shopName}
              </h1>
              <p className="mt-1 text-sm font-medium text-blue-600">Premium Mobile Accessories & Devices</p>
              <p className="mt-0.5 text-xs text-gray-400">GST: 07ABCDE1234F1Z5 | Since 2024</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 shadow-lg sm:h-20 sm:w-20">
              <span className="text-2xl font-black text-white sm:text-3xl">📱</span>
            </div>
          </div>

          {/* Divider */}
          <div className="my-5 border-t-2 border-dashed border-gray-200" />

          {/* Invoice Meta: Number & Date/Time */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Invoice</p>
              <p className="text-sm font-bold text-gray-800">{invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Date & Time</p>
              <p className="text-sm font-bold text-gray-800">{formatDate(now)}</p>
              <p className="text-xs font-medium text-gray-500">{formatTime(now)}</p>
            </div>
          </div>

          {/* Bold Underline */}
          <div className="my-5 border-b-2 border-gray-900" />

          {/* Greeting */}
          <div className="mb-1">
            <p className="text-lg font-bold text-gray-800">
              {greeting}, <span className="text-blue-700">{userName}</span> 👋
            </p>
            <p className="mt-0.5 text-xs text-gray-400">Thank you for choosing {shopName} for your purchase.</p>
          </div>

          {/* Underline with Flowers */}
          <div className="my-4 flex items-center gap-2 text-xs text-pink-400">
            <span className="flex-1 border-b border-dashed border-pink-200" />
            <span>🌸 ✿ 🌸</span>
            <span className="flex-1 border-b border-dashed border-pink-200" />
          </div>

          {/* Billed Items */}
          <div className="space-y-5">
            {items.map((item, index) => {
              const printedPrice = item.product.printedPrice || item.product.price
              const sellingPrice = item.product.price
              const itemPrintedTotal = printedPrice * item.quantity
              const itemSellingTotal = sellingPrice * item.quantity
              const itemSavings = itemPrintedTotal - itemSellingTotal
              const discountPercent = printedPrice > sellingPrice
                ? Math.round(((printedPrice - sellingPrice) / printedPrice) * 100)
                : 0

              return (
                <div key={item.productId} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white p-2 shadow-sm sm:block">
                      <img
                        src={getPrimaryImage(item.product)}
                        alt={item.product.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Product Name & Category */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {index + 1}. {item.product.name}
                          </p>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                            {item.product.category}
                          </p>
                        </div>
                      </div>

                      {/* Pricing Table */}
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[400px] text-xs">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="py-1.5 text-left font-semibold text-gray-500">Description</th>
                              <th className="py-1.5 text-right font-semibold text-gray-500">Price (₹)</th>
                              <th className="py-1.5 text-center font-semibold text-gray-500">Qty</th>
                              <th className="py-1.5 text-right font-semibold text-gray-500">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-dashed border-gray-100">
                              <td className="py-2 text-gray-600">Printed Price (MRP)</td>
                              <td className="py-2 text-right font-medium text-gray-700">{formatPrice(printedPrice)}</td>
                              <td className="py-2 text-center font-medium text-gray-700">{item.quantity}</td>
                              <td className="py-2 text-right font-medium text-gray-700">{formatPrice(itemPrintedTotal)}</td>
                            </tr>
                            {discountPercent > 0 && (
                              <tr className="border-b border-dashed border-gray-100">
                                <td className="py-2 text-green-700">
                                  Discount ({discountPercent}% off)
                                  <span className="text-gray-400"> (Saved {formatPrice(itemSavings)})</span>
                                </td>
                                <td className="py-2" />
                                <td className="py-2" />
                                <td className="py-2 text-right font-semibold text-green-700">
                                  -{formatPrice(itemSavings)}
                                </td>
                              </tr>
                            )}
                            <tr className="bg-white/60">
                              <td className="py-2 font-bold text-gray-800">Selling Price</td>
                              <td className="py-2 text-right font-bold text-blue-700">{formatPrice(sellingPrice)}</td>
                              <td className="py-2 text-center font-bold text-blue-700">{item.quantity}</td>
                              <td className="py-2 text-right font-bold text-blue-700">{formatPrice(itemSellingTotal)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Free Gift with Image */}
                      {item.product.gift?.name && (
                        <div className="mt-2 flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2">
                          {item.product.gift.imageUrl ? (
                            <img
                              src={item.product.gift.imageUrl}
                              alt={item.product.gift.name}
                              className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-amber-200"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-base">
                              🎁
                            </span>
                          )}
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-amber-800">
                              Free Gift: {item.product.gift.name}
                            </span>
                            {item.product.gift.description && (
                              <p className="text-[10px] text-amber-600">{item.product.gift.description}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Seller Contact Number */}
                      {item.product.sellerMobileNumber && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                          <span className="text-xs font-semibold text-gray-600">📞 Contact Number:</span>
                          <a
                            href={`tel:${item.product.sellerMobileNumber}`}
                            className="text-sm font-bold text-blue-700 hover:underline"
                          >
                            {item.product.sellerMobileNumber}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Grand Total Section */}
          <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 sm:p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Payment Summary</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total (MRP)</span>
                <span className="font-semibold text-gray-700">{formatPrice(grandPrintedTotal)}</span>
              </div>
              {hasSavings && (
                <div className="flex items-center justify-between text-green-700">
                  <span>Total Discount</span>
                  <span className="font-bold">−{formatPrice(grandSavings)}</span>
                </div>
              )}
              <div className="border-t-2 border-gray-300 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-gray-900">Total Payable</span>
                  <span className="text-xl font-black text-blue-700">{formatPrice(grandSellingTotal)}</span>
                </div>
                {hasSavings && (
                  <p className="mt-1 text-right text-xs font-medium text-green-600">
                    You saved {formatPrice(grandSavings)} on this order 🎉
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="mb-4 border-t-2 border-gray-900" />
            <p className="text-base font-bold text-gray-800">
              Thank You for shopping from <span className="text-blue-700">{shopName}</span>
            </p>
            <p className="mt-1 text-sm font-medium text-gray-500">Have a nice day! 🌟</p>
            <div className="mt-4 border-b-2 border-gray-900" />

            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-gray-400">
              <span>Invoice: {invoiceNumber}</span>
              <span>•</span>
              <span>Generated on: {formatDate(now)} at {formatTime(now)}</span>
              <span>•</span>
              <span>© {shopName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}