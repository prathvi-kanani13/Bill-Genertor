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

interface UploadDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (files: { fileName: string; file: File }[], billId: string) => void;
    value?: { fileName: string; file?: File; url?: string }[]; 
    billId: string;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ open, onClose, onSubmit, value, billId }) => {
    const [fileInputs, setFileInputs] = useState<{ fileName: string; file: File | null }[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
    const [viewFiles, setViewFiles] = useState<{ name: string; url: string }[]>([]);

    // Restore files when dialog opens
    useEffect(() => {
        if (open) {
            if (value && value.length > 0) {
                setFileInputs(value.map(f => ({ fileName: f.fileName, file: f.file || null })));
                setUploadedFiles(value.map(f => ({
                    name: f.fileName,
                    url: f.url || (f.file ? URL.createObjectURL(f.file) : ""),
                })));
            } else {
                setFileInputs([{ fileName: "", file: null }]);
                setUploadedFiles([]);
            }
        } else {
            setFileInputs([]);
            setUploadedFiles([]);
        }
    }, [open, value]);

    // Upload a new file
    const handleFileUpload = (file: File, index: number) => {
        const reader = new FileReader();
        reader.onload = () => {
            const url = reader.result as string;
            setFileInputs(prev => {
                const updated = [...prev];
                updated[index] = { fileName: file.name, file };
                return updated;
            });
            setUploadedFiles(prev => {
                const updated = [...prev];
                updated[index] = { name: file.name, url };
                return updated;
            });
        };
        reader.readAsDataURL(file);
    };

    // Add another input
    const handleAddInput = () => {
        setFileInputs([...fileInputs, { fileName: "", file: null }]);
        setUploadedFiles([...uploadedFiles, { name: "", url: "" }]);
    };

    // Delete a file by its index
    const handleDeleteFile = (index: number) => {
        setFileInputs(prev => prev.filter((_, i) => i !== index));
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: "fileName" | "file", value: string | File | null) => {
        const updated = [...fileInputs];
        if (field === "fileName" && typeof value === "string") {
            updated[index].fileName = value;
        } else if (field === "file" && value instanceof File) {
            handleFileUpload(value, index);
            return;
        }
        setFileInputs(updated);
    };

    const handleSave = () => {
        const validFiles = fileInputs.filter(f => f.fileName && f.file);
        if (validFiles.length > 0) {
            onSubmit(validFiles as { fileName: string; file: File }[], billId);
        }
        onClose();
    };

    const handleCancel = () => onClose();

    return (
        <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
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
                    onClick={() => {
                        setFileInputs([{ fileName: "", file: null }]);
                        setUploadedFiles([]);
                    }}
                >
                    DELETE ALL
                </Button>
            </DialogTitle>

            <DialogContent dividers>
                {fileInputs.map((input, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                        <TextField
                            label="File Name"
                            value={input.fileName}
                            onChange={(e) => handleChange(index, "fileName", e.target.value)}
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
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleChange(index, "file", file);
                                }}
                            />
                        </Button>

                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => setViewFiles(uploadedFiles.filter(f => f.url))} // all uploaded files
                            disabled={uploadedFiles.length === 0}
                        >
                            View
                        </Button>

                        <IconButton color="error" onClick={() => handleDeleteFile(index)}>
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
                <Button onClick={handleCancel}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={fileInputs.length === 0}
                    sx={{ bgcolor: "#3f51b5", "&:hover": { bgcolor: "#303f9f" } }}
                >
                    Save
                </Button>
            </DialogActions>

            <ViewDocumentDialog
                open={viewFiles.length > 0}
                onClose={() => setViewFiles([])}
                documentFiles={viewFiles} // all uploaded files
            />
        </Dialog>
    );
};

export default UploadDialog;
