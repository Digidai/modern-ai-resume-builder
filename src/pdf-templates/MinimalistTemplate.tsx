import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PdfTemplateProps, COLORS } from './shared';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Times-Roman', // Minimalist uses Serif
    backgroundColor: COLORS.white,
    color: COLORS.slate900,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.black,
    paddingBottom: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  name: {
    fontSize: 28, // text-5xl is huge, scaling down slightly for PDF readability
    fontFamily: 'Times-Bold',
    color: COLORS.slate900,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Times-Italic',
    color: COLORS.slate600,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  contactItem: {
    fontSize: 9,
    color: COLORS.slate500,
    fontFamily: 'Times-Roman',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: 'Times-Bold',
    color: COLORS.slate900,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    paddingBottom: 4,
    marginBottom: 12,
  },
  centerSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
    color: COLORS.slate700,
    lineHeight: 1.6,
    textAlign: 'center',
    maxWidth: '80%',
  },
  competenciesTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold', // This specific header was Sans in HTML
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: COLORS.slate400,
    marginBottom: 6,
  },
  competenciesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  competencyItem: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
    color: COLORS.slate800,
  },
  expGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  expDateCol: {
    width: '25%',
    paddingRight: 10,
  },
  expContentCol: {
    width: '75%',
  },
  dateText: {
    fontSize: 10,
    color: COLORS.slate500,
    fontFamily: 'Helvetica', // Date looks better in Sans often, matches HTML
    textAlign: 'right',
  },
  role: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    color: COLORS.slate900,
    marginBottom: 2,
  },
  company: {
    fontSize: 10,
    fontFamily: 'Times-Italic',
    color: COLORS.slate700,
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
    color: COLORS.slate700,
    lineHeight: 1.5,
  },
  projectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  projectItem: {
    width: '48%',
    marginBottom: 10,
  },
  eduRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
        <View style={styles.centerSection}>
          <Text style={styles.summaryText}>{data.summary}</Text>
        </View>
      )}

      {data.skills.length > 0 && (
        <View style={{ ...styles.centerSection, borderTopWidth: 1, borderTopColor: COLORS.slate100, borderBottomWidth: 1, borderBottomColor: COLORS.slate100, paddingVertical: 12 }}>
          <Text style={styles.competenciesTitle}>Core Competencies</Text>
          <View style={styles.competenciesList}>
            {data.skills.map((skill, index) => (
              <Text key={index} style={styles.competencyItem}>
                {skill}
              </Text>
            ))}
          </View>
        </View>
      )}

      {data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Experience</Text>
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
      )}

      {data.projects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Projects</Text>
          <View style={styles.projectGrid}>
            {data.projects.map((proj) => (
              <View key={proj.id} style={styles.projectItem} wrap={false}>
                <Text style={styles.role}>{proj.name}</Text>
                {proj.link && <Text style={{ fontSize: 9, color: COLORS.slate400, marginBottom: 2 }}>{proj.link}</Text>}
                <Text style={styles.description}>{proj.description}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {data.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Education</Text>
          {data.education.map((edu) => (
            <View key={edu.id} style={styles.eduRow} wrap={false}>
              <View>
                <Text style={styles.role}>{edu.school}</Text>
                <Text style={styles.company}>{edu.degree}</Text>
              </View>
              <Text style={styles.dateText}>
                {edu.startDate} — {edu.endDate}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
};
