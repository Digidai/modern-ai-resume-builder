import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PdfTemplateProps, COLORS, SPACING, FONT_SIZE } from './shared';

const styles = StyleSheet.create({
  page: {
    // No flexDirection, default block layout
    backgroundColor: COLORS.white,
    fontFamily: 'Roboto',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '33.33%',
    height: '100%',
    backgroundColor: COLORS.slate900,
    padding: SPACING['8'],
    color: COLORS.slate200,
  },
  main: {
    marginLeft: '33.33%',
    width: '66.67%',
    padding: SPACING['8'],
    color: COLORS.slate900,
  },
  
  // Sidebar Content
  sidebarHeaderBlock: {
    marginBottom: SPACING['4'],
    gap: SPACING['1'],
  },
  sidebarName: {
    fontSize: FONT_SIZE['3xl'],
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
    lineHeight: 1.25,
  },
  sidebarTitle: {
    fontSize: FONT_SIZE['lg'],
    color: COLORS.indigo400,
    fontFamily: 'Roboto',
    fontWeight: 'medium',
  },
  
  sidebarContactList: {
    gap: SPACING['4'],
    marginBottom: SPACING['8'],
  },
  contactItem: {
    marginBottom: 0,
  },
  contactLabel: {
    fontSize: FONT_SIZE['xs'],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.slate500,
    marginBottom: SPACING['1'],
    fontFamily: 'Roboto',
  },
  contactValue: {
    fontSize: FONT_SIZE['sm'],
    color: COLORS.slate300,
  },
  
  // Sidebar Sections
  sidebarSection: {
    marginBottom: 0, 
  },
  sidebarSectionHeader: {
    fontSize: FONT_SIZE['xs'],
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate700,
    paddingBottom: SPACING['2'],
    marginBottom: SPACING['4'],
  },
  skillChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING['2'],
  },
  skillChip: {
    paddingHorizontal: SPACING['2'],
    paddingVertical: SPACING['1'],
    backgroundColor: COLORS.slate800,
    borderRadius: 4,
  },
  skillText: {
    fontSize: FONT_SIZE['xs'],
    color: COLORS.slate300,
  },
  
  // Sidebar Edu
  eduList: {
    gap: SPACING['4'],
  },
  eduSchool: {
    fontSize: FONT_SIZE['sm'],
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: COLORS.white,
  },
  eduDegree: {
    fontSize: FONT_SIZE['xs'],
    color: COLORS.slate400,
    marginBottom: SPACING['1'],
  },
  eduDate: {
    fontSize: FONT_SIZE['xs'],
    color: COLORS.slate500,
  },
  
  // Main Content
  mainSection: {
    marginBottom: SPACING['8'],
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING['4'],
    gap: SPACING['2'],
  },
  headerBar: {
    width: SPACING['8'],
    height: 3,
    backgroundColor: COLORS.slate900,
  },
  headerTitle: {
    fontSize: FONT_SIZE['xl'],
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: COLORS.slate800,
    textTransform: 'uppercase',
    letterSpacing: -0.25,
  },
  
  // Profile
  summaryText: {
    fontSize: FONT_SIZE['sm'],
    color: COLORS.slate600,
    lineHeight: 1.625,
    textAlign: 'justify',
  },
  
  // Experience
  expList: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.slate100,
    paddingLeft: SPACING['6'],
    marginLeft: 4,
    gap: SPACING['8'],
  },
  expItem: {
    position: 'relative',
  },
  expDot: {
    position: 'absolute',
    left: -23.25,
    top: 4.5,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.slate200,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  role: {
    fontSize: FONT_SIZE['lg'],
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: COLORS.slate900,
    marginBottom: SPACING['1'],
  },
  expMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING['3'],
    fontSize: FONT_SIZE['sm'],
    color: COLORS.slate500,
  },
  company: {
    fontFamily: 'Roboto',
    fontWeight: 'bold', // font-semibold
    color: COLORS.indigo600,
  },
  description: {
    fontSize: FONT_SIZE['sm'],
    color: COLORS.slate600,
    lineHeight: 1.625,
  },
  
  // Projects
  projList: {
    gap: SPACING['4'],
  },
  projItem: {
    backgroundColor: COLORS.slate50,
    padding: SPACING['4'],
    borderRadius: 8,
  },
  projHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING['2'],
  },
  projName: {
    fontSize: FONT_SIZE['base'],
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: COLORS.slate900,
  },
  projLink: {
    fontSize: FONT_SIZE['xs'],
    color: COLORS.indigo600,
  },
  projDesc: {
    fontSize: FONT_SIZE['sm'],
    color: COLORS.slate600,
  },
});

export const SidebarTemplatePdf: React.FC<PdfTemplateProps> = ({ data }) => {
  return (
    <Page size="A4" style={styles.page}>
      {/* Sidebar - Absolute positioned and fixed to repeat on each page */}
      <View style={styles.sidebar} fixed>
        <View style={styles.sidebarHeaderBlock}>
          <Text style={styles.sidebarName}>{data.fullName}</Text>
          <Text style={styles.sidebarTitle}>{data.title}</Text>
        </View>

        <View style={styles.sidebarContactList}>
          {data.email && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{data.email}</Text>
            </View>
          )}
          {data.phone && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>{data.phone}</Text>
            </View>
          )}
          {data.location && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Location</Text>
              <Text style={styles.contactValue}>{data.location}</Text>
            </View>
          )}
          {data.website && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Portfolio</Text>
              <Text style={styles.contactValue}>{data.website}</Text>
            </View>
          )}
          {data.linkedin && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>LinkedIn</Text>
              <Text style={styles.contactValue}>{data.linkedin}</Text>
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
