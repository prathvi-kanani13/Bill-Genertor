import React, { useState, useEffect } from 'react';
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

interface ViewDocumentDialogProps {
    open: boolean;
    onClose: () => void;
    documentFiles: { name: string; url: string; }[];
}

const ViewDocumentDialog: React.FC<ViewDocumentDialogProps> = ({ open, onClose, documentFiles }) => {
    const previewableFiles = documentFiles.filter(file =>
        file.url.startsWith("data:application/pdf") ||
        file.url.startsWith("data:image/png") ||
        file.url.startsWith("data:image/jpeg")
    );

    const [selectedFile, setSelectedFile] = useState<typeof previewableFiles[0] | null>(null);

    useEffect(() => {
        if (previewableFiles.length > 0) {
            setSelectedFile(previewableFiles[0]);
        } else {
            setSelectedFile(null);
        }
    }, [previewableFiles, open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>View Uploaded Documents</DialogTitle>
            <DialogContent sx={{ display: "flex", gap: 2 }}>
                {previewableFiles.length === 0 ? (
                    <Typography>No documents available.</Typography>
                ) : (
                    <>
                        {previewableFiles.length > 1 && (
                            <Box sx={{ minWidth: 200, maxHeight: 400, overflowY: "auto", mr: 2 }}>
                                <Typography sx={{ mb: 1, fontWeight: "bold" }}>
                                    Select a document:
                                </Typography>
                                <List dense>
                                    {previewableFiles.map((file, idx) => (
                                        <ListItemButton
                                            key={idx}
                                            onClick={() => setSelectedFile(file)}
                                            selected={selectedFile?.name === file.name}
                                        >
                                            <ListItemText primary={file.name} />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Box>
                        )}

                        <Box sx={{ flex: 1 }}>
                            {selectedFile && selectedFile.url.startsWith("data:application/pdf") ? (
                                <iframe
                                    src={selectedFile.url}
                                    title={selectedFile.name}
                                    width="100%"
                                    height="500px"
                                    style={{ border: "1px solid #ccc", borderRadius: "8px" }}
                                />
                            ) : (
                                selectedFile && (
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
