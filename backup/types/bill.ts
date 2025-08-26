export interface Bill {
    id: number;
    billNo: string;
    partyName: string;
    date: string;
    tax?: string;
    amount?: string;
    invoice?: string;
    invoiceName?: string;
    invoices?: {
        name: string;
        url: string;
        data?: string;
        // type: 'sales' | 'voucher';
        invoiceId?: number;
    }[];
}
