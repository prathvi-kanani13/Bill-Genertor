import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from "@mui/material";
import { Bill } from "../types/bill";
import InvoiceSection from "./InvoiceSetion";
import { getMimePrefix } from "../utils/getMimePrefix";

interface EditBillDialogProps {
    open: boolean;
    onClose: () => void;
    bill: Bill | null;
    onSave: (updatedBill: Bill) => void;
    mode: "add" | "edit";
}

const EditBillDialog: React.FC<EditBillDialogProps> = ({ open, onClose, bill, onSave, mode }) => {
    const [editedBill, setEditedBill] = useState<Bill>({
        id: 0,
        billNo: "",
        partyName: "",
        date: "",
        invoice: "",
        tax: "",
        amount: "",
        invoices: []
    });

    const [showInvoiceOptions, setShowInvoiceOptions] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // When dialog opens, reset editedBill
    useEffect(() => {
        if (open && bill) {
            const invoices = bill.invoices?.map(inv => ({
                name: inv.name || `Invoice-${bill.billNo}.pdf`,
                type: inv.type || "sales",
                url: inv.url?.startsWith("data:")
                    ? inv.url
                    : `${getMimePrefix(inv.url)}${inv.url}`
            })) || [];

            setEditedBill({ ...bill, invoices });
        } else {
            setEditedBill({
                id: 0,
                billNo: "",
                partyName: "",
                date: "",
                invoice: "",
                tax: "",
                amount: "",
                invoices: []
            });
        }
    }, [open, bill]);
    

    // Upload file and mark its type, prevent duplicates
    const handleUpload = (file: File, type: "sales" | "voucher") => {
        const reader = new FileReader();

        reader.onloadend = () => {
            const fileUrl = reader.result as string; // Full Base64 string with MIME

            const newFile = {
                name: file.name,
                url: fileUrl,
                type,
            };

            setEditedBill(prev => {
                const isAlreadyUploaded = prev.invoices?.some(
                    f => f.name === newFile.name && f.type === newFile.type
                );
                if (isAlreadyUploaded) return prev;

                return {
                    ...prev,
                    invoices: [...(prev.invoices || []), newFile]
                };
            });
        };

        reader.readAsDataURL(file); // auto-detects MIME type
    };


    // Delete specific file by name and type
    const handleDelete = (type: "sales" | "voucher", fileName?: string) => {
        if (!fileName) return;
        setEditedBill(prev => ({
            ...prev,
            invoices: prev.invoices?.filter(f => f.name !== fileName || f.type !== type) || []
        }));
    };

    // Delete all of a type
    const handleDeleteAll = (type: "sales" | "voucher") => {
        setEditedBill(prev => ({
            ...prev,
            invoices: prev.invoices?.filter(f => f.type !== type) || []
        }));
    };

    const handleSave = () => {
        const newErrors: { [key: string]: string } = {};

        if (!editedBill.billNo.trim()) newErrors.billNo = "Bill No is required.";
        if (!editedBill.partyName.trim()) newErrors.partyName = "Party Name is required.";
        if (!editedBill.date.trim()) newErrors.date = "Date is required.";
        if (!editedBill.tax?.toString().trim()) newErrors.tax = "Tax is required.";
        if (!editedBill.amount?.toString().trim()) newErrors.amount = "Amount is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave(editedBill);
        onClose();
    };

    const handleCancel = () => {
        setEditedBill(bill || {
            id: 0,
            billNo: "",
            partyName: "",
            date: "",
            invoice: "",
            tax: "",
            amount: "",
            invoices: []
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">

            <DialogTitle sx={{ color: "#3f51b5", fontWeight: "bold" }}>
                {mode === "add" ? "Add Bill" : "Edit Bill"}
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>

                    <TextField
                        label="Bill No"
                        fullWidth
                        sx={{ flex: "1 1 48%" }}
                        value={editedBill.billNo}
                        onChange={(e) => setEditedBill({ ...editedBill, billNo: e.target.value })}
                        error={!!errors.billNo}
                        helperText={errors.billNo}
                        InputProps={{
                            readOnly: mode === "edit", // disable editing if in "edit" mode
                        }}
                    />

                    <TextField
                        label="Party Name"
                        fullWidth
                        sx={{ flex: "1 1 48%" }}
                        value={editedBill.partyName}
                        onChange={(e) => setEditedBill({ ...editedBill, partyName: e.target.value })}
                        error={!!errors.partyName}
                        helperText={errors.partyName}
                    />

                    <TextField
                        label="Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ flex: "1 1 48%" }}
                        value={editedBill.date}
                        onChange={(e) => setEditedBill({ ...editedBill, date: e.target.value })}
                        error={!!errors.date}
                        helperText={errors.date}
                    />

                    <TextField
                        label="Tax"
                        fullWidth
                        sx={{ flex: "1 1 48%" }}
                        value={editedBill.tax}
                        onChange={(e) => setEditedBill({ ...editedBill, tax: e.target.value })}
                        error={!!errors.tax}
                        helperText={errors.tax}
                    />

                    <TextField
                        label="Amount"
                        fullWidth
                        sx={{ flex: "1 1 48%" }}
                        value={editedBill.amount}
                        onChange={(e) => setEditedBill({ ...editedBill, amount: e.target.value })}
                        error={!!errors.amount}
                        helperText={errors.amount}
                    />
                </Box>

                <Button
                    variant="contained"
                    sx={{ mt: 2, bgcolor: "#3f51b5", "&:hover": { bgcolor: "#303f9f" } }}
                    onClick={() => setShowInvoiceOptions(prev => !prev)}
                >
                    Invoice
                </Button>

                {showInvoiceOptions && (
                    <InvoiceSection
                        onUpload={handleUpload}
                        onDelete={handleDelete}
                        onDeleteAll={handleDeleteAll}
                        onSave={() => { }}
                        existingInvoices={editedBill.invoices || []}
                    />
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button variant="contained" onClick={handleSave}
                    sx={{ bgcolor: "#3f51b5", "&:hover": { bgcolor: "#303f9f" } }}>
                    Save
                </Button>
            </DialogActions>

        </Dialog>
    );
};

export default EditBillDialog;