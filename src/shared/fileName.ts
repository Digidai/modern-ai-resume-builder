// Shared by the editor's downloads and the Worker (agent API + MCP), so every export is named alike.

/**
 * Download file name: "Pat_Lee_Resume.pdf", or with the resume's word for resume ("王思远_简历.pdf"). The name
 * keeps its capitals and any script's letters, so a recruiter can tell attachments apart; characters that
 * aren't safe in file names are dropped.
 */
export const resumeFileName = (fullName: string, extension: string, word = 'Resume'): string => {
  const base = fullName.trim().replace(/\s+/g, '_').replace(/[^\p{L}\p{M}\p{N}_.-]/gu, '');
  return `${base ? `${base}_` : ''}${word}.${extension}`;
};
