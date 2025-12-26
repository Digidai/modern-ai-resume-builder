import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PdfTemplateProps, COLORS, SPACING, FONT_SIZE } from './shared';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    fontFamily: 'Helvetica',
  },
  sidebar: {
    width: '33.33%',
    backgroundColor: COLORS.slate900,
    padding: SPACING['8'], // p-8
    color: COLORS.slate200,
    minHeight: '100%',
    flexGrow: 1,
  },
  main: {
    width: '66.67%',
    padding: SPACING['8'], // p-8
    backgroundColor: COLORS.white,
    color: COLORS.slate900,
    minHeight: '100%',
    flexGrow: 1,
  },
  
  // Sidebar Content
  sidebarHeaderBlock: {
    marginBottom: SPACING['4'], // mb-4
    gap: SPACING['1'], // gap-1
  },
  sidebarName: {
    fontSize: FONT_SIZE['3xl'], // text-3xl
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    letterSpacing: 0.5, // tracking-wider
    lineHeight: 1.25, // leading-tight
  },
  sidebarTitle: {
    fontSize: FONT_SIZE['lg'], // text-lg
    color: COLORS.indigo400,
    fontFamily: 'Helvetica-Bold', // font-medium
  },
  
  sidebarContactList: {
    gap: SPACING['4'], // gap-4
    marginBottom: SPACING['8'],
  },
  contactItem: {
    fontSize: FONT_SIZE['sm'], // text-sm
    color: COLORS.slate300,
  },
  contactLabel: {
    fontSize: FONT_SIZE['xs'], // text-xs
    textTransform: 'uppercase',
    letterSpacing: 0.5, // tracking-wider
    color: COLORS.slate500,
    marginBottom: SPACING['1'], // mb-1
    display: 'flex',
    fontFamily: 'Helvetica', // block
  },
  
  // Sidebar Sections (Skills/Edu)
  sidebarSection: {
    marginBottom: 0, 
  },
  sidebarSectionHeader: {
    fontSize: FONT_SIZE['xs'], // text-xs
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5, // tracking-widest
    color: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate700,
    paddingBottom: SPACING['2'], // pb-2
    marginBottom: SPACING['4'], // mb-4
  },
  skillChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING['2'], // gap-2
  },
  skillChip: {
    paddingHorizontal: SPACING['2'], // px-2
    paddingVertical: SPACING['1'], // py-1
    backgroundColor: COLORS.slate800,
    borderRadius: 4, // rounded
  },
  skillText: {
    fontSize: FONT_SIZE['xs'], // text-xs
    color: COLORS.slate300,
  },
  
  // Sidebar Edu
  eduList: {
    gap: SPACING['4'], // gap-4
  },
  eduSchool: {
    fontSize: FONT_SIZE['sm'], // text-sm
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
  },
  eduDegree: {
    fontSize: FONT_SIZE['xs'], // text-xs
    color: COLORS.slate400,
    marginBottom: SPACING['1'], // mb-1
  },
  eduDate: {
    fontSize: FONT_SIZE['xs'], // text-xs
    color: COLORS.slate500,
  },
  
  // Main Content
  mainSection: {
    marginBottom: SPACING['8'], // implicit spacing? No, templates stick usually.
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING['4'], // mb-4
    gap: SPACING['2'], // gap-2
  },
  headerBar: {
    width: SPACING['8'], // w-8
    height: 4, // h-1 (4px -> 3pt)
    backgroundColor: COLORS.slate900,
  },
  headerTitle: {
    fontSize: FONT_SIZE['xl'], // text-xl
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate800,
    textTransform: 'uppercase',
    letterSpacing: -0.25, // tracking-tight
  },
  
  // Profile
  summaryText: {
    fontSize: FONT_SIZE['sm'], // text-sm
    color: COLORS.slate600,
    lineHeight: 1.625, // relaxed
    textAlign: 'justify',
  },
  
  // Experience
  expList: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.slate100,
    paddingLeft: SPACING['6'], // pl-6
    marginLeft: 4, // ml-1 (4px)
    gap: SPACING['8'], // gap-8
  },
  expItem: {
    position: 'relative',
  },
  expDot: {
    position: 'absolute',
    left: -31, // -left-[31px] (-23.25pt)
    top: 4.5, // top-1.5 (6px -> 4.5pt)
    width: 9, // w-3 (12px -> 9pt)
    height: 9, // h-3
    borderRadius: 4.5,
    backgroundColor: COLORS.slate200,
    borderWidth: 2, // border-2
    borderColor: COLORS.white,
  },
  role: {
    fontSize: FONT_SIZE['lg'], // text-lg
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
    marginBottom: SPACING['1'], // mb-1
  },
  expMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING['3'], // mb-3
    fontSize: FONT_SIZE['sm'], // text-sm
    color: COLORS.slate500,
  },
  company: {
    fontFamily: 'Helvetica-Bold', // font-semibold
    color: COLORS.indigo600,
  },
  description: {
    fontSize: FONT_SIZE['sm'], // text-sm
    color: COLORS.slate600,
    lineHeight: 1.625, // relaxed
  },
  
  // Projects
  projList: {
    gap: SPACING['4'], // gap-4
  },
  projItem: {
    backgroundColor: COLORS.slate50,
    padding: SPACING['4'], // p-4
    borderRadius: 8, // rounded-lg
  },
  projHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING['2'], // mb-2
  },
  projName: {
    fontSize: FONT_SIZE['base'], // text-base (implicit)
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
  },
  projLink: {
    fontSize: FONT_SIZE['xs'], // text-xs
    color: COLORS.indigo600,
  },
  projDesc: {
    fontSize: FONT_SIZE['sm'], // text-sm
    color: COLORS.slate600,
  },
});

export const SidebarTemplatePdf: React.FC<PdfTemplateProps> = ({ data }) => {
  return (
    <Page size="A4" style={styles.page}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeaderBlock}>
          <Text style={styles.sidebarName}>{data.fullName}</Text>
          <Text style={styles.sidebarTitle}>{data.title}</Text>
        </View>

        <View style={styles.sidebarContactList}>
          {data.email && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text>{data.email}</Text>
            </View>
          )}
          {data.phone && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text>{data.phone}</Text>
            </View>
          )}
          {data.location && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Location</Text>
              <Text>{data.location}</Text>
            </View>
          )}
          {data.website && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Portfolio</Text>
              <Text>{data.website}</Text>
            </View>
          )}
          {data.linkedin && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>LinkedIn</Text>
              <Text>{data.linkedin}</Text>
            </View>
          )}
        </View>

        {data.skills.length > 0 && (
          <View style={{ ...styles.sidebarSection, marginBottom: SPACING['8'] }}>
            <Text style={styles.sidebarSectionHeader}>Skills</Text>
            <View style={styles.skillChips}>
              {data.skills.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.education.length > 0 && (
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionHeader}>Education</Text>
            <View style={styles.eduList}>
              {data.education.map((edu) => (
                <View key={edu.id}>
                  <Text style={styles.eduSchool}>{edu.school}</Text>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  <Text style={styles.eduDate}>{edu.startDate} — {edu.endDate}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        {data.summary && (
          <View style={styles.mainSection}>
            <View style={styles.mainHeader}>
              <View style={styles.headerBar} />
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
            <Text style={styles.summaryText}>{data.summary}</Text>
          </View>
        )}

        {data.experience.length > 0 && (
          <View style={{ ...styles.mainSection, marginBottom: SPACING['8'] }}>
             <View style={{ ...styles.mainHeader, marginBottom: SPACING['6'] }}>
              <View style={styles.headerBar} />
              <Text style={styles.headerTitle}>Experience</Text>
            </View>
            <View style={styles.expList}>
              {data.experience.map((exp) => (
                <View key={exp.id} style={styles.expItem} wrap={false}>
                  <View style={styles.expDot} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SPACING['1'] }}>
                     <Text style={styles.role}>{exp.role}</Text>
                  </View>
                  <View style={styles.expMeta}>
                    <Text style={styles.company}>{exp.company}</Text>
                    <Text>{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</Text>
                  </View>
                  <Text style={styles.description}>{exp.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.projects.length > 0 && (
          <View style={styles.mainSection}>
             <View style={styles.mainHeader}>
              <View style={styles.headerBar} />
              <Text style={styles.headerTitle}>Projects</Text>
            </View>
            <View style={styles.projList}>
              {data.projects.map((proj) => (
                <View key={proj.id} style={styles.projItem} wrap={false}>
                  <View style={styles.projHeader}>
                    <Text style={styles.projName}>{proj.name}</Text>
                    {proj.link && <Text style={styles.projLink}>{proj.link}</Text>}
                  </View>
                  <Text style={styles.projDesc}>{proj.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </Page>
  );
};