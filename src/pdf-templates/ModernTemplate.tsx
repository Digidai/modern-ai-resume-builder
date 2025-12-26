import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { PdfTemplateProps, COLORS } from './shared';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.white,
    color: COLORS.slate900,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    paddingBottom: 20,
    marginBottom: 20,
  },
  name: {
    fontSize: 26, // text-4xl approx
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: COLORS.slate900,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 14, // text-xl approx
    color: COLORS.slate600,
    fontWeight: 'light',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactItem: {
    fontSize: 9, // text-sm approx
    color: COLORS.slate600,
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: COLORS.slate400,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 10,
    color: COLORS.slate700,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  experienceItem: {
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  role: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
  },
  date: {
    fontSize: 9,
    color: COLORS.slate500,
  },
  company: {
    fontSize: 10,
    color: COLORS.slate600,
    fontFamily: 'Helvetica-Bold', // ResumeEditor uses font-medium which maps to Bold often in PDF
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    color: COLORS.slate700,
    lineHeight: 1.5,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: COLORS.slate100,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skillText: {
    fontSize: 9,
    color: COLORS.slate700,
    fontFamily: 'Helvetica-Bold',
  },
  eduItem: {
    marginBottom: 8,
  },
  school: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
  },
  degree: {
    fontSize: 10,
    color: COLORS.slate600,
  },
});

export const ModernTemplatePdf: React.FC<PdfTemplateProps> = ({ data }) => {
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.summaryText}>{data.summary}</Text>
        </View>
      )}

      {data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {data.experience.map((exp) => (
            <View key={exp.id} style={styles.experienceItem} wrap={false}>
              <View style={styles.rowBetween}>
                <Text style={styles.role}>{exp.role}</Text>
                <Text style={styles.date}>
                  {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                </Text>
              </View>
              <Text style={styles.company}>{exp.company}</Text>
              <Text style={styles.description}>{exp.description}</Text>
            </View>
          ))}
        </View>
      )}

      {data.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsRow}>
            {data.skills.map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {data.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {data.education.map((edu) => (
            <View key={edu.id} style={styles.eduItem} wrap={false}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.school}>{edu.school}</Text>
                  <Text style={styles.degree}>{edu.degree}</Text>
                </View>
                <Text style={styles.date}>
                  {edu.startDate} — {edu.endDate}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
};
