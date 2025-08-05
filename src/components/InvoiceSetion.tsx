import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface InvoiceSectionProps {
    onUpload: (file: File, type: 'sales' | 'voucher', fileUrl: string) => void;
    onDelete: (type: 'sales' | 'voucher', fileName?: string) => void;
    onDeleteAll?: (type: 'sales' | 'voucher') => void;
    onSave: () => void;
    existingInvoices: {
        name: string;
        url: string;
        type: 'sales' | 'voucher';
        invoiceId?: number;
    }[];
}

interface UploadedFile {
    file: File;
    url: string;
}

const InvoiceSection: React.FC<InvoiceSectionProps> = ({
    onUpload,
    onDelete,
    onDeleteAll,
    onSave,
    existingInvoices
}) => {
    const [selectedType, setSelectedType] = useState<'sales' | 'voucher' | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<Record<'sales' | 'voucher', UploadedFile[]>>({
        sales: [],
        voucher: [],
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const extractBase64 = (dataUrl: string) => dataUrl.split(',')[1];

    const handleButtonClick = (type: 'sales' | 'voucher') => {
        setSelectedType(type);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { // 'e' is a event object and triggered when the user selects a file 
        const files = Array.from(e.target.files || []); //Convert uploaded files into an array
        if (selectedType && files.length > 0) { // file type are selected 'sales' ya 'voucher'
            const newFiles = files.map(file => {
                const url = URL.createObjectURL(file); // Create a previewable URL
                onUpload(file, selectedType, url); // Call parent function to handle upload
                return { file, url }; // Store file + URL in local component state
            });

            setUploadedFiles(prev => ({ // add ner file in local state
                ...prev,
                [selectedType]: [...prev[selectedType], ...newFiles]
            }));
        }

        if (fileInputRef.current) { // reset the file input 
            fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = async (fileName: string) => {
        if (!selectedType) return;

        // Check if file is from existing invoices
        const invoice = existingInvoices.find(
            inv => inv.name === fileName && inv.type === selectedType && inv.invoiceId
        );

        if (invoice) {
            const payload = {
                invoiceId: invoice.invoiceId,
                invoiceType: selectedType === 'sales' ? 'S' : 'V',
                invoiceFileName: invoice.name,
                invoiceFileType: `.${invoice.name.split('.').pop()}`,
                invoiceFile: extractBase64(invoice.url),
            };

            try {
                const res = await fetch("http://10.55.2.48:8081/deleteinvoice", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const result = await res.text();
                if (result === "1") {
                    onDelete(selectedType, fileName);
                } else {
                    console.error("Delete failed");
                }
            } catch (err) {
                console.error("Error deleting invoice:", err);
            }
        } else {
            // File is locally uploaded only
            setUploadedFiles(prev => ({
                ...prev,
                [selectedType]: prev[selectedType].filter(f => f.file.name !== fileName),
            }));
            onDelete(selectedType, fileName);
        }
    };

    const handleDeleteAll = async () => {
        if (!selectedType) return;

        const invoicesToDelete = existingInvoices.filter(
            inv => inv.type === selectedType && inv.invoiceId
        );

        if (invoicesToDelete.length > 0) {
            const payload = invoicesToDelete.map(inv => ({
                invoiceId: inv.invoiceId,
                invoiceType: selectedType === 'sales' ? 'S' : 'V',
                invoiceFileName: inv.name,
                invoiceFileType: `.${inv.name.split('.').pop()}`,
                invoiceFile: extractBase64(inv.url),
            }));

            try {
                const res = await fetch("http://10.55.2.48:8081/deleteallinvoice", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const result = await res.text();
                if (result === "1") {
                    onDelete(selectedType);
                    onDeleteAll?.(selectedType);
                } else {
                    console.error("Delete all failed");
                }
            } catch (err) {
                console.error("Error deleting all invoices:", err);
            }
        } else {
            // No existing, just clear local
            onDelete(selectedType);
            onDeleteAll?.(selectedType);
        }

        setUploadedFiles(prev => ({
            ...prev,
            [selectedType]: [],
        }));
    };

    const handleSave = () => {
        if (selectedType && uploadedFiles[selectedType].length > 0) {
            onSave();
        }
    };

    // any type selected and upload file so show type and file name
    const filteredExisting = selectedType
        ? existingInvoices.filter(inv => inv.type === selectedType)
        : [];

    const combinedFileNames = new Set(); // 'Set'is a unique value, no file name appears more than once
 
    // all existing and uploaded file for the selected type (converted to { name, url, type } format)
    const displayFiles = selectedType
        ? [
            ...filteredExisting,
            ...uploadedFiles[selectedType].map(file => ({
                name: file.file.name,
                url: file.url,
                type: selectedType,
            }))
        ].filter(file => {
            if (combinedFileNames.has(file.name)) return false; // no two files with the same name it’s skipped
            combinedFileNames.add(file.name);
            return true;
        })
        : [];

    return (
        <Box mt={2}>
            <Button variant="contained" onClick={() => handleButtonClick('sales')} sx={{ mr: 1, background: "#3f51b5" }}>
                Sales Invoice
            </Button>
            <Button variant="contained" onClick={() => handleButtonClick('voucher')} sx={{ background: "#3f51b5" }}>
                Voucher
            </Button>

            {selectedType && (
                <Box mt={2}>
                    <Button variant="outlined" onClick={handleUploadClick} sx={{ mr: 1 }}>
                        Upload {selectedType}
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDeleteAll}
                        disabled={displayFiles.length === 0}
                        sx={{ mr: 1 }}
                    >
                        Delete All
                    </Button>
                    <Button
                        variant="outlined"
                        color="success"
                        onClick={handleSave}
                        disabled={displayFiles.length === 0}
                    >
                        Save
                    </Button>

                    <List sx={{ mt: 1 }}>
                        {displayFiles.map((file, idx) => (
                            <ListItem
                                key={`${file.name}-${idx}`}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() => handleDeleteFile(file.name)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={file.name} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                multiple
            />
        </Box>
    );
};

export default InvoiceSection;