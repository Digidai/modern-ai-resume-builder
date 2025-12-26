import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PdfTemplateProps, COLORS, SPACING, FONT_SIZE } from './shared';

const styles = StyleSheet.create({
  page: {
    paddingTop: SPACING['10'],
    paddingBottom: SPACING['10'],
    paddingHorizontal: SPACING['10'], // ~40px
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.white,
    color: COLORS.slate900,
  },
  // Header
  header: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    paddingBottom: SPACING['8'], // pb-8
    marginBottom: SPACING['8'],  // gap-8 (between header and body)
  },
  name: {
    fontSize: FONT_SIZE['4xl'], // text-4xl
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: COLORS.slate900,
    letterSpacing: -0.5, // tracking-tight
    lineHeight: 1,
  },
  title: {
    fontSize: FONT_SIZE['xl'], // text-xl
    color: COLORS.slate600,
    marginTop: SPACING['2'], // mt-2
    fontFamily: 'Helvetica', // font-light fallback
    letterSpacing: 0.5, // tracking-wide
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING['4'], // gap-4
    marginTop: SPACING['6'], // mt-6
  },
  contactItem: {
    fontSize: FONT_SIZE['sm'], // text-sm
    color: COLORS.slate600,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Sections
  section: {
    marginBottom: 0, // Parent gap handles spacing usually, but here we use manual spacing
  },
  sectionContainer: {
    marginBottom: SPACING['8'], // gap-8 equivalent for main layout
  },
  sectionTitle: {
    fontSize: FONT_SIZE['sm'], // text-sm
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: COLORS.slate400,
    letterSpacing: 1.5, // tracking-widest
    marginBottom: SPACING['3'], // mb-3
  },
  
  // Content
  summaryText: {
    fontSize: FONT_SIZE['sm'], // text-sm (web uses text-sm for summary body too)
    color: COLORS.slate700,
    lineHeight: 1.625, // relaxed
    textAlign: 'justify',
  },
  
  // Experience
  expList: {
    flexDirection: 'column',
    gap: SPACING['6'], // gap-6
  },
  expItem: {
    marginBottom: SPACING['6'],
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING['1'], // mb-1
  },
  role: {
    fontSize: FONT_SIZE['base'], // Web uses implicit base or explicit? Web: h3 font-bold (base)
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
  },
  date: {
    fontSize: FONT_SIZE['sm'], // text-sm
    color: COLORS.slate500,
  },
  company: {
    fontSize: FONT_SIZE['base'], // text-base/medium
    color: COLORS.slate600,
    fontFamily: 'Helvetica-Bold', // font-medium -> Bold in PDF
    marginBottom: SPACING['2'], // mb-2
  },
  description: {
    fontSize: FONT_SIZE['sm'], // text-sm
    color: COLORS.slate700,
    lineHeight: 1.625, // relaxed
  },
  
  // Skills
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING['2'], // gap-2
  },
  skillChip: {
    paddingHorizontal: SPACING['3'], // px-3
    paddingVertical: SPACING['1'], // py-1
    backgroundColor: COLORS.slate100,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 6, // rounded-md
  },
  skillText: {
    fontSize: FONT_SIZE['xs'], // text-xs
    fontFamily: 'Helvetica-Bold', // font-semibold
    color: COLORS.slate700,
  },
  
  // Education
  eduList: {
    flexDirection: 'column',
    gap: SPACING['4'], // gap-4
  },
  eduItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  school: {
    fontSize: FONT_SIZE['base'],
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
  },
  degree: {
    fontSize: FONT_SIZE['sm'], // text-sm
    color: COLORS.slate600,
    marginTop: 0,
  },
  eduDate: {
    fontSize: FONT_SIZE['sm'], // text-sm
    color: COLORS.slate500,
    whiteSpace: 'nowrap',
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
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.summaryText}>{data.summary}</Text>
        </View>
      )}

      {data.experience.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <View style={styles.expList}>
            {data.experience.map((exp) => (
              <View key={exp.id} wrap={false}>
                <View style={styles.expHeader}>
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
        </View>
      )}

      {data.skills.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsList}>
            {data.skills.map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {data.education.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Education</Text>
          <View style={styles.eduList}>
            {data.education.map((edu) => (
              <View key={edu.id} style={styles.eduItem} wrap={false}>
                <View>
                  <Text style={styles.school}>{edu.school}</Text>
                  <Text style={styles.degree}>{edu.degree}</Text>
                </View>
                <Text style={styles.eduDate}>
                  {edu.startDate} — {edu.endDate}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Page>
  );
};