import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Printer, CheckCircle2, X } from 'lucide-react';

interface ThermalPrintModalProps {
  orderId: string | null;
  onClose: () => void;
  onPrintedSuccess?: () => void;
}

export const ThermalPrintModal: React.FC<ThermalPrintModalProps> = ({
  orderId,
  onClose,
  onPrintedSuccess,
}) => {
  const [printData, setPrintData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchPrintText = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/${orderId}/kot-print`);
        if (res.data.success) {
          setPrintData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrintText();
  }, [orderId]);

  if (!orderId) return null;

  // Single Print Order trigger button
  const handlePrintOrder = () => {
    setPrinting(true);

    try {
      // Create hidden print iframe to trigger browser print dialogs for Kitchen and Beverage KOTs
      const printContent = `
        <html>
          <head>
            <title>KOT Print - ${printData?.kotNumber || ''}</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; }
              .kot-block { margin-bottom: 20px; page-break-after: always; }
              pre { white-space: pre-wrap; word-break: break-all; margin: 0; }
            </style>
          </head>
          <body>
            ${printData?.foodKotText ? `<div class="kot-block"><pre>${printData.foodKotText}</pre></div>` : ''}
            ${printData?.beverageKotText ? `<div class="kot-block"><pre>${printData.beverageKotText}</pre></div>` : ''}
          </body>
        </html>
      `;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printContent);
        doc.close();
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }

      setTimeout(() => {
        document.body.removeChild(iframe);
        setPrinting(false);
        if (onPrintedSuccess) onPrintedSuccess();
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
      setPrinting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-6 max-w-md w-full text-cream-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gold-500/20">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-gold-400" />
            <h3 className="font-serif text-lg font-bold text-gold-300">
              Print Order KOT ({printData?.kotNumber || 'Generating...'})
            </h3>
          </div>
          <button onClick={onClose} className="text-cream-200/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gold-400 font-mono text-xs animate-pulse">
            Generating KOT Data...
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-cafe-950 p-4 rounded-2xl border border-gold-500/20 space-y-2">
              <p className="font-bold text-gold-300">Order Summary:</p>
              <p>KOT Number: <strong className="font-mono text-gold-400">{printData?.kotNumber}</strong></p>
              <p>Table Number: <strong>Table {printData?.tableNumber}</strong></p>
              <div className="pt-2 border-t border-gold-500/10 text-cream-200/80 space-y-1">
                {printData?.hasFood && <p className="text-green-400 font-semibold">✓ Kitchen Food KOT Ready</p>}
                {printData?.hasBeverage && <p className="text-amber-400 font-semibold">✓ Beverage Bar KOT Ready</p>}
              </div>
            </div>

            {/* SINGLE PRINT ORDER BUTTON */}
            <button
              onClick={handlePrintOrder}
              disabled={printing}
              className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3.5 px-4 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              {printing ? 'Printing KOTs...' : 'Print Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
