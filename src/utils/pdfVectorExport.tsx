import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ResumeData } from '../types';
import { ModernTemplatePdf } from '../pdf-templates/ModernTemplate';
import { MinimalistTemplatePdf } from '../pdf-templates/MinimalistTemplate';
import { SidebarTemplatePdf } from '../pdf-templates/SidebarTemplate';
import { Document } from '@react-pdf/renderer';
import '../pdf-templates/shared';
import { supportsPdfVector } from '../constants/templates';

export const supportsVectorTemplate = supportsPdfVector;

// Check for characters outside Latin-1 range (Standard fonts only support Latin-1)
// @react-pdf uses fontkit, which is smarter, but if we don't load a Chinese font, it will still render tofu boxes.
// So we keep this check.
const hasNonLatinCharacters = (str: string) => {
  return /[^\u0000-\u00FF]/.test(str);
};

// Wrapper Component to hold the specific template page
const ResumeDocument: React.FC<{ data: ResumeData }> = ({ data }) => {
  switch (data.templateId) {
    case 'modern':
      return <Document title={`${data.fullName} - Resume`} author={data.fullName}><ModernTemplatePdf data={data} /></Document>;
    case 'minimalist':
      return <Document title={`${data.fullName} - Resume`} author={data.fullName}><MinimalistTemplatePdf data={data} /></Document>;
    case 'sidebar':
      return <Document title={`${data.fullName} - Resume`} author={data.fullName}><SidebarTemplatePdf data={data} /></Document>;
    default:
      return null;
  }
};

export const exportResumeVectorPdf = async (data: ResumeData): Promise<Blob> => {
  // 1. Safety Check for non-Latin characters
  const jsonString = JSON.stringify(data);
  if (hasNonLatinCharacters(jsonString)) {
    throw new Error("Resume contains non-Latin characters. Vector export skipped to avoid missing fonts.");
  }

  if (!supportsVectorTemplate(data.templateId)) {
    throw new Error(`Vector export not supported for template: ${data.templateId}`);
  }

  // 2. Generate PDF using @react-pdf
  const blob = await pdf(<ResumeDocument data={data} />).toBlob();
  return blob;
};