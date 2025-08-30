import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItemButton,
    ListItemText,
    Typography,
    Box
} from '@mui/material';
import { getMimePrefix } from "../utils/getMimePrefix";

interface ViewDocumentDialogProps {
    open: boolean;
    onClose: () => void;
    documentFiles: { name: string; url: string; }[];
}

const ViewDocumentDialog: React.FC<ViewDocumentDialogProps> = ({ open, onClose, documentFiles }) => {
    const previewableFiles = useMemo(() => {
        return documentFiles.map(file => {
            const needsPrefix = !file.url.startsWith("data:");
            const fullUrl = needsPrefix ? getMimePrefix(file.url) + file.url : file.url;
            return { ...file, url: fullUrl };
        }).filter(file =>
            file.url.startsWith("data:application/pdf") ||
            file.url.startsWith("data:image/png") ||
            file.url.startsWith("data:image/jpeg")
        );
    }, [documentFiles]);

    const [selectedFile, setSelectedFile] = useState<{ name: string; url: string; isPreviewable: boolean } | null>(null);

    useEffect(() => {
        if (open) {
            // Select the first previewable file by default if available
            if (previewableFiles.length > 0) {
                setSelectedFile({ ...previewableFiles[0], isPreviewable: true });
            } else if (documentFiles.length > 0) {
                // Otherwise, select the first file in the list (non-previewable)
                setSelectedFile({ ...documentFiles[0], isPreviewable: false });
            } else {
                setSelectedFile(null);
            }
        }
    }, [previewableFiles, documentFiles, open]);

    const handleFileSelect = (file: { name: string; url: string }) => {
        const isPreviewable =
            file.url.startsWith("data:application/pdf") ||
            file.url.startsWith("data:image/png") ||
            file.url.startsWith("data:image/jpeg");

        if (isPreviewable) {
            const fullUrl = !file.url.startsWith("data:") ? getMimePrefix(file.url) + file.url : file.url;
            setSelectedFile({ ...file, url: fullUrl, isPreviewable: true });
        } else {
            setSelectedFile({ ...file, isPreviewable: false });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>View Uploaded Documents</DialogTitle>
            <DialogContent sx={{ display: "flex", gap: 2 }}>
                {documentFiles.length === 0 ? (
                    <Typography>No documents available.</Typography>
                ) : (
                    <>
                        <Box sx={{ minWidth: 200, maxHeight: 400, overflowY: "auto", mr: 2 }}>
                            <Typography sx={{ mb: 1, fontWeight: "bold" }}>
                                Select a document:
                            </Typography>
                            <List dense>
                                {documentFiles.map((file, idx) => (
                                    <ListItemButton
                                        key={idx}
                                        onClick={() => handleFileSelect(file)}
                                        selected={selectedFile?.name === file.name}
                                    >
                                        <ListItemText primary={file.name} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            {selectedFile?.isPreviewable ? (
                                selectedFile.url.startsWith("data:application/pdf") ? (
                                    <iframe
                                        src={selectedFile.url}
                                        title={selectedFile.name}
                                        width="100%"
                                        height="500px"
                                        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
                                    />
                                ) : (
                                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                                        <img
                                            src={selectedFile.url}
                                            alt={selectedFile.name}
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "500px",
                                                borderRadius: "8px",
                                                border: "1px solid #ccc"
                                            }}
                                        />
                                    </Box>
                                )
                            ) : (
                                <Box sx={{ p: 2, border: "1px solid #ccc", borderRadius: "8px" }}>
                                    <Typography>This document cannot be previewed. Would you like to download it?</Typography>
                                    {selectedFile && (
                                        <Button
                                            variant="contained"
                                            href={selectedFile.url}
                                            download={selectedFile.name}
                                            component="a"
                                            sx={{
                                                mt: 2,
                                                bgcolor: "#3f51b5",
                                                "&:hover": { bgcolor: "#303f9f" }
                                            }}
                                        >
                                            Download ({selectedFile.name})
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{ bgcolor: "#3f51b5", "&:hover": { bgcolor: "#303f9f" } }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewDocumentDialog;