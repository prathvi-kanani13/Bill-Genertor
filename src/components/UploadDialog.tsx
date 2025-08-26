import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    IconButton,
    Box,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ViewDocumentDialog from "./ViewDocumentdialog";
import { getMimePrefix } from "../utils/getMimePrefix";

interface UploadDialogProps {
    open: boolean;
    onClose: () => void;
    onDeleteInvoice: (invoiceId: number, billId: string) => void;
    onDeleteAllInvoices: (invoiceIds: number[], billId: string) => void;
    onSubmit: (
        files: { fileName: string; file: File; invoiceName: string }[],
        billId: string,
        deletedIds: number[]
    ) => void;
    value?: {
        fileName: string;
        file?: File;
        url?: string;
        invoiceId?: number;
        invoiceName?: string;
        invoiceFileName?: string;
        invoiceFileType?: string;
        invoiceFile?: string;
    }[];
    billId: string;
}

// strip prefix helper
// const stripBase64Prefix = (base64?: string) => {
//     if (!base64) return "";
//     const parts = base64.split(",");
//     return parts.length > 1 ? parts[1] : base64;
// };

const UploadDialog: React.FC<UploadDialogProps> = ({
    open,
    onClose,
    onSubmit,
    value,
    billId,
    onDeleteInvoice,
    onDeleteAllInvoices
}) => {
    const [fileInputs, setFileInputs] = useState<
        {
            fileName: string;
            file: File | null;
            invoiceId?: number;
            invoiceName?: string;
            invoiceFileName?: string;
            invoiceFileType?: string;
            invoiceFile?: string;
        }[]
    >([]);
    const [uploadedFiles, setUploadedFiles] = useState<
        { name: string; url: string; invoiceId?: number }[]
    >([]);
    const [viewFiles, setViewFiles] = useState<{ name: string; url: string }[]>([]);
    const [deletedIds, setDeletedIds] = useState<number[]>([]);

    // Load existing invoices when dialog opens
    useEffect(() => {
        if (open) {
            if (value && value.length > 0) {
                const filtered = value.filter((f) => !deletedIds.includes(f.invoiceId!));
                setFileInputs(
                    filtered.map((f) => ({
                        fileName: f.fileName,
                        file: f.file || null,
                        invoiceId: f.invoiceId,
                        invoiceName: f.invoiceName || f.fileName,
                        invoiceFileName: f.invoiceFileName,
                        invoiceFileType: f.invoiceFileType,
                        invoiceFile: f.invoiceFile,
                    }))
                );
                setUploadedFiles(
                    filtered.map((f) => ({
                        name: f.fileName,
                        url:
                            f.url ||
                            (f.file
                                ? URL.createObjectURL(f.file)
                                : f.invoiceFile
                                    ? `${getMimePrefix(f.invoiceFile)}${f.invoiceFile}`
                                    : ""),
                        invoiceId: f.invoiceId,
                    }))
                );
            } else {
                setFileInputs([{ fileName: "", file: null, invoiceName: "" }]);
                setUploadedFiles([]);
            }
        } else {
            // reset when closed
            setFileInputs([]);
            setUploadedFiles([]);
            setDeletedIds([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, value]);

    // Handle file upload
    const handleFileUpload = (file: File, index: number) => {
        const reader = new FileReader();
        reader.onload = () => {
            const url = reader.result as string;
            setFileInputs((prev) => {
                const updated = [...prev];
                // Check if invoiceName is already set by the user, otherwise use file.name
                const newInvoiceName = updated[index].invoiceName || file.name;
                updated[index] = {
                    ...updated[index],
                    fileName: file.name,
                    invoiceName: newInvoiceName,
                    file,
                };
                return updated;
            });
            setUploadedFiles((prev) => {
                const updated = [...prev];
                updated[index] = { name: file.name, url };
                return updated;
            });
        };
        reader.readAsDataURL(file);
    };

    // Add new input row
    const handleAddInput = () => {
        setFileInputs((prev) => [...prev, { fileName: "", file: null, invoiceName: "" }]);
        setUploadedFiles((prev) => [...prev, { name: "", url: "" }]);
    };

    // Delete single file (local + API if invoiceId exists)
    const handleDeleteFile = (index: number) => {
        const file = fileInputs[index];

        // If the file has an invoiceId, it exists in the database
        if (file.invoiceId) {
            // Call the parent's delete function, passing the invoiceId and current billId
            onDeleteInvoice(file.invoiceId, billId); //  Call the new prop
        } else {
            // For newly uploaded files (no invoiceId), just remove them from local state
            setFileInputs((prev) => prev.filter((_, i) => i !== index));
            setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
        }
    };

    // Delete ALL files
    const handleDeleteAll = () => {
        // Filter to get only the files that have an invoiceId (i.e., exist on the backend)
        const existingInvoicesToDelete = fileInputs
            .filter((f) => f.invoiceId)
            .map((f) => f.invoiceId!);

        // If there are no existing invoices to delete, just reset local state.
        if (existingInvoicesToDelete.length === 0) {
            setFileInputs([{ fileName: "", file: null, invoiceName: "" }]);
            setUploadedFiles([]);
            return;
        }

        // Call the parent component's function to handle the deletion
        onDeleteAllInvoices(existingInvoicesToDelete, billId);

        // After calling the parent's handler, reset the local state immediately
        // to provide instant UI feedback to the user.
        setFileInputs([{ fileName: "", file: null, invoiceName: "" }]);
        setUploadedFiles([]);
    };

    // Handle input change
    const handleChange = (
        index: number,
        field: "file" | "invoiceName",
        value: string | File | null
    ) => {
        setFileInputs(prev => {
            const updated = [...prev];
            if (field === "invoiceName" && typeof value === "string") {
                updated[index].invoiceName = value;
            } else if (field === "file" && value instanceof File) {
                updated[index].file = value;
                updated[index].fileName = value.name;
                updated[index].invoiceFileType = `.${value.name.split(".").pop()}`;
                // Set the invoiceName to the file name if it's not already set
                if (!updated[index].invoiceName) {
                    updated[index].invoiceName = value.name;
                }
            }
            return updated;
        });
    };

    // Save selected files
    const handleSave = () => {
        const validFiles = fileInputs
            .filter((f) => f.file)
            .map((f) => ({
                invoiceName: f.invoiceName || f.fileName || f.file!.name,
                fileName: f.fileName || f.file!.name,
                file: f.file!, // ! (non-null assertion in TypeScript) file is not empty ys undefiend
            }));

        // console.log("Files to be submitted:", validFiles);
        onSubmit(validFiles, billId, deletedIds);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#3f51b5",
                    fontWeight: "bold",
                }}
            >
                <span>Upload Files</span>
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleDeleteAll}
                    disabled={fileInputs.length === 0}
                >
                    DELETE ALL
                </Button>
            </DialogTitle>

            <DialogContent dividers>
                {fileInputs.map((input, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                        <TextField
                            label="Invoice Name"
                            value={input.invoiceName || ""}
                            onChange={(e) =>
                                handleChange(index, "invoiceName", e.target.value)
                            }
                            fullWidth
                        />

                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadFileIcon />}
                            size="small"
                        >
                            File
                            <input
                                type="file"
                                hidden
                                // accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, index); // Use new handler
                                }}
                            />
                        </Button>

                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() =>
                                setViewFiles([
                                    {
                                        name: uploadedFiles[index]?.name,
                                        url: uploadedFiles[index]?.url,
                                    },
                                ])
                            }
                            disabled={!uploadedFiles[index]?.url}
                        >
                            View
                        </Button>

                        <IconButton
                            color="error"
                            type="button"
                            onClick={() => handleDeleteFile(index)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                ))}

                <Button
                    onClick={handleAddInput}
                    variant="contained"
                    size="small"
                    sx={{ bgcolor: "#3f51b5", color: "white" }}
                >
                    Add Another
                </Button>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    sx={{ bgcolor: "#3f51b5", "&:hover": { bgcolor: "#303f9f" } }}
                >
                    Save
                </Button>
            </DialogActions>

            <ViewDocumentDialog
                open={viewFiles.length > 0}
                onClose={() => setViewFiles([])}
                documentFiles={viewFiles}
            />
        </Dialog>
    );
};

export default UploadDialog;