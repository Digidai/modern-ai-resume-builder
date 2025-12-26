import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PdfTemplateProps, COLORS, SPACING, FONT_SIZE } from './shared';

const styles = StyleSheet.create({
  page: {
    paddingTop: SPACING['10'],
    paddingBottom: SPACING['10'],
    paddingHorizontal: SPACING['10'],
    fontFamily: 'Times-Roman',
    backgroundColor: COLORS.white,
    color: COLORS.slate900,
  },
  // Header
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
    paddingBottom: SPACING['6'],
    marginBottom: SPACING['2'],
  },
  name: {
    fontSize: FONT_SIZE['5xl'],
    fontFamily: 'Times-Bold',
    color: COLORS.slate900,
    marginBottom: SPACING['2'],
    letterSpacing: -0.5,
    lineHeight: 1,
  },
  title: {
    fontSize: FONT_SIZE['xl'],
    fontFamily: 'Times-Italic',
    color: COLORS.slate600,
    marginBottom: SPACING['4'],
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING['4'],
  },
  contactItem: {
    fontSize: FONT_SIZE['sm'],
    color: COLORS.slate500,
    fontFamily: 'Times-Roman',
  },
  
  // Layout
  mainGrid: {
    marginTop: SPACING['4'],
    gap: SPACING['8'],
  },
  
  // Summary
  summarySection: {
    marginTop: 0,
    alignItems: 'center',
    marginBottom: SPACING['4'],
  },
  summaryText: {
    fontSize: FONT_SIZE['base'],
    fontFamily: 'Times-Roman',
    color: COLORS.slate700,
    lineHeight: 1.625,
    textAlign: 'center',
    maxWidth: '90%',
    alignSelf: 'center',
  },
  
  // Skills
  skillsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    paddingVertical: SPACING['4'],
    alignItems: 'center',
    marginBottom: 0,
  },
  skillsTitle: {
    fontSize: FONT_SIZE['xs'],
    fontFamily: 'Helvetica-Bold', // Web says font-bold uppercase.
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: COLORS.slate400,
    marginBottom: SPACING['3'],
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING['3'],
  },
  skillText: {
    fontSize: FONT_SIZE['sm'],
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate800,
  },
  
  // Section Headers
  sectionHeader: {
    fontSize: FONT_SIZE['xl'],
    fontFamily: 'Times-Bold',
    color: COLORS.slate900,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    paddingBottom: SPACING['2'],
    marginBottom: SPACING['6'],
  },
  
  // Experience
  expList: {
    gap: SPACING['8'],
  },
  expGrid: {
    flexDirection: 'row',
    gap: SPACING['4'],
  },
  expDateCol: {
    width: '20%',
  },
  expContentCol: {
    width: '80%',
  },
  dateText: {
    fontSize: FONT_SIZE['sm'],
    color: COLORS.slate500,
    fontFamily: 'Helvetica-Bold', // Sans for dates
    marginTop: 2,
  },
  role: {
    fontSize: FONT_SIZE['lg'],
    fontFamily: 'Times-Bold',
    color: COLORS.slate900,
  },
  company: {
    fontSize: FONT_SIZE['base'],
    fontFamily: 'Times-Italic',
    color: COLORS.slate700,
    marginBottom: SPACING['2'],
  },
  description: {
    fontSize: FONT_SIZE['sm'],
    fontFamily: 'Times-Roman',
    color: COLORS.slate700,
    lineHeight: 1.625,
  },
  
  // Projects
  projectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING['6'],
  },
  projectItem: {
    width: '45%',
    marginBottom: 0,
  },
  projHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  projName: {
    fontSize: FONT_SIZE['base'],
    fontFamily: 'Times-Bold',
    color: COLORS.slate900,
  },
  projLink: {
    fontSize: FONT_SIZE['xs'],
    color: COLORS.slate400,
  },
  projDesc: {
    marginTop: SPACING['1'],
    fontSize: FONT_SIZE['sm'],
    color: COLORS.slate600,
    lineHeight: 1.4,
  },
  
  // Education
  eduList: {
    gap: SPACING['4'],
  },
  eduRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export const MinimalistTemplatePdf: React.FC<PdfTemplateProps> = ({ data }) => {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{data.fullName}</Text>
        <Text style={styles.title}>{data.title}</Text>
        <View style={styles.contactRow}>
          {[data.email, data.phone, data.location, data.website, data.linkedin]
            .filter(Boolean)
            .map((item, i) => (
              <Text key={i} style={styles.contactItem}>
                {i > 0 ? ' • ' : ''}
                {item}
              </Text>
            ))}
        </View>
      </View>

      {data.summary && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryText}>{data.summary}</Text>
        </View>
      )}

      {data.skills.length > 0 && (
        <View style={styles.skillsSection}>
          <Text style={styles.skillsTitle}>Core Competencies</Text>
          <View style={styles.skillsList}>
            {data.skills.map((skill, index) => (
              <Text key={index} style={styles.skillText}>{skill}</Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.mainGrid}>
        {data.experience.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Experience</Text>
            <View style={styles.expList}>
              {data.experience.map((exp) => (
                <View key={exp.id} style={styles.expGrid} wrap={false}>
                  <View style={styles.expDateCol}>
                    <Text style={styles.dateText}>
                      {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                    </Text>
                  </View>
                  <View style={styles.expContentCol}>
                    <Text style={styles.role}>{exp.role}</Text>
                    <Text style={styles.company}>{exp.company}</Text>
                    <Text style={styles.description}>{exp.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.projects.length > 0 && (
          <View>
            <Text style={{ ...styles.sectionHeader, marginBottom: SPACING['4'] }}>Projects</Text>
            <View style={styles.projectGrid}>
              {data.projects.map((proj) => (
                <View key={proj.id} style={styles.projectItem} wrap={false}>
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

        {data.education.length > 0 && (
          <View>
            <Text style={{ ...styles.sectionHeader, marginBottom: SPACING['4'] }}>Education</Text>
            <View style={styles.eduList}>
              {data.education.map((edu) => (
                <View key={edu.id} style={styles.eduRow} wrap={false}>
                  <View>
                    <Text style={{ ...styles.role, fontSize: FONT_SIZE.base }}>{edu.school}</Text>
                    <Text style={{ ...styles.company, fontFamily: 'Times-Italic', fontSize: FONT_SIZE.sm, marginBottom: 0 }}>{edu.degree}</Text>
                  </View>
                  <Text style={{ ...styles.dateText, fontFamily: 'Helvetica' }}>{edu.startDate} — {edu.endDate}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </Page>
  );
};
