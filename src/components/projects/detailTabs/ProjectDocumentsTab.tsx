import React, { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  AssignmentTurnedIn as ChecklistIcon,
  Description as DocumentIcon,
  Draw as ContractIcon,
  FactCheck as PermitIcon,
  InsertDriveFile as FileIcon,
  OpenInNew as OpenIcon,
  Payments as InvoiceIcon,
  Architecture as PlanIcon,
  RadioButtonUnchecked as MissingIcon,
  TaskAlt as CompleteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { useProjectDocuments } from '../../../hooks/use-documents';
import { Document } from '../../../types';

type DocumentCategory = {
  type: Document['type'];
  label: string;
  description: string;
  icon: React.ReactNode;
};

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    type: 'contract',
    label: 'Contracts',
    description: 'Owner agreements, scopes, change orders',
    icon: <ContractIcon fontSize="small" />,
  },
  {
    type: 'blueprint',
    label: 'Plans',
    description: 'Drawings, specs, takeoffs, revisions',
    icon: <PlanIcon fontSize="small" />,
  },
  {
    type: 'permit',
    label: 'Permits',
    description: 'Permits, inspections, jurisdiction approvals',
    icon: <PermitIcon fontSize="small" />,
  },
  {
    type: 'invoice',
    label: 'Invoices',
    description: 'Vendor invoices, payment applications, receipts',
    icon: <InvoiceIcon fontSize="small" />,
  },
  {
    type: 'other',
    label: 'Other Files',
    description: 'Photos, correspondence, closeout items',
    icon: <FileIcon fontSize="small" />,
  },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const formatDate = (date?: Date) => {
  if (!date) return 'No date';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

const formatFileSize = (size?: number) => {
  if (!size) return null;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocumentUrl = (document: Document) => document.url || (document as unknown as { fileUrl?: string }).fileUrl;
const getDocumentSize = (document: Document) => document.size ?? (document as unknown as { fileSize?: number }).fileSize;
const getDocumentDate = (document: Document) =>
  document.createdAt || (document as unknown as { uploadedAt?: Date }).uploadedAt || document.updatedAt;

const ProjectDocumentsTab: React.FC = () => {
  const theme = useTheme();
  const { projectId, project, loading, error } = useProjectDetail();
  const {
    data: projectDocuments = [],
    isLoading: documentsLoading,
    error: documentsError,
  } = useProjectDocuments(projectId || '', { isArchived: false }, !!projectId);

  const requiredDocuments = useMemo(() => {
    const requirementLabels = [
      ...(project?.requirements?.documents || []),
      ...(project?.requirements?.permits || []).map((permit) => `${permit} permit`),
      ...(project?.requirements?.inspections || []).map((inspection) => `${inspection} inspection`),
    ];

    const baseChecklist = [
      'Signed contract',
      'Approved plan set',
      'Permit card',
      'Subcontractor insurance',
      'Final inspection signoff',
    ];

    return Array.from(new Set([...requirementLabels, ...baseChecklist].filter(Boolean)));
  }, [project?.requirements]);

  const checklistItems = useMemo(() => {
    const activeDocuments = projectDocuments.filter((document) => !document.isArchived);

    return requiredDocuments.map((label) => {
      const normalizedLabel = normalize(label);
      const matchingDocument = activeDocuments.find((document) => {
        const normalizedName = normalize(document.name);
        return normalizedName.includes(normalizedLabel) || normalizedLabel.includes(normalizedName);
      });

      return { label, document: matchingDocument };
    });
  }, [projectDocuments, requiredDocuments]);

  const completedChecklistCount = checklistItems.filter((item) => item.document).length;
  const completionPercent = checklistItems.length
    ? Math.round((completedChecklistCount / checklistItems.length) * 100)
    : 0;

  const documentsByType = useMemo(() => {
    return DOCUMENT_CATEGORIES.reduce<Record<Document['type'], Document[]>>((acc, category) => {
      acc[category.type] = projectDocuments.filter(
        (document) => !document.isArchived && document.type === category.type
      );
      return acc;
    }, {
      contract: [],
      permit: [],
      blueprint: [],
      invoice: [],
      other: [],
    });
  }, [projectDocuments]);

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>Error loading project document data: {error}</Alert>;
  }

  if (!projectId) {
    return <Alert severity="warning" sx={{ mt: 2 }}>Project context not available.</Alert>;
  }

  return (
    <>
      <Box sx={{ mt: 3, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Project Documents</Typography>
          <Typography variant="body2" color="text.secondary">
            Track required builder documents and uploaded project files.
          </Typography>
        </Box>
      </Box>

      {documentsError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Documents could not be loaded. Checklist requirements are still shown from the project setup.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <ChecklistIcon color="primary" />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>Builder Checklist</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {completedChecklistCount} of {checklistItems.length} items matched to uploaded files
                  </Typography>
                </Box>
              </Stack>
              <Chip label={`${completionPercent}% complete`} color={completionPercent === 100 ? 'success' : 'default'} />
            </Box>

            <LinearProgress
              variant="determinate"
              value={completionPercent}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />

            <List disablePadding>
              {checklistItems.map((item) => {
                const documentUrl = item.document ? getDocumentUrl(item.document) : undefined;

                return (
                  <ListItem
                    key={item.label}
                    disableGutters
                    secondaryAction={
                      documentUrl ? (
                        <Button
                          component="a"
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          endIcon={<OpenIcon />}
                        >
                          Open
                        </Button>
                      ) : (
                        <Chip size="small" label="Needed" variant="outlined" />
                      )
                    }
                    sx={{ py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {item.document ? <CompleteIcon color="success" /> : <MissingIcon color="disabled" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.document ? item.document.name : 'No matching upload yet'}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              mb: 3,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Document Categories</Typography>
            <Grid container spacing={1.5}>
              {DOCUMENT_CATEGORIES.map((category) => (
                <Grid item xs={12} sm={6} key={category.type}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                      minHeight: 96,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                      {category.icon}
                      <Typography variant="body2" fontWeight={600}>{category.label}</Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700}>{documentsByType[category.type].length}</Typography>
                    <Typography variant="caption" color="text.secondary">{category.description}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <DocumentIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>Recent Files</Typography>
            </Stack>
            <Divider sx={{ mb: 1 }} />

            {documentsLoading ? (
              <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 3 }} />
            ) : projectDocuments.length === 0 ? (
              <Alert severity="info">No documents have been uploaded for this project yet.</Alert>
            ) : (
              <List disablePadding>
                {projectDocuments.slice(0, 6).map((document) => {
                  const documentUrl = getDocumentUrl(document);
                  const fileSize = formatFileSize(getDocumentSize(document));

                  return (
                    <ListItem
                      key={document.id}
                      disableGutters
                      secondaryAction={
                        documentUrl ? (
                          <Button
                            component="a"
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            endIcon={<OpenIcon />}
                          >
                            Open
                          </Button>
                        ) : null
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <DocumentIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={document.name}
                        secondary={[
                          DOCUMENT_CATEGORIES.find((category) => category.type === document.type)?.label || 'Other Files',
                          formatDate(getDocumentDate(document)),
                          fileSize,
                        ].filter(Boolean).join(' | ')}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default ProjectDocumentsTab;
