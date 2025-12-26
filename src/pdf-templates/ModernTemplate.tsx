import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PdfTemplateProps, COLORS, SPACING, FONT_SIZE, MailIconPdf, PhoneIconPdf, MapPinIconPdf, GlobeIconPdf, LinkedinIconPdf } from './shared';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40, 
    fontFamily: 'Roboto',
    backgroundColor: COLORS.white,
    color: COLORS.slate900,
  },
  // Header
  header: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    paddingBottom: SPACING['6'], 
    marginBottom: SPACING['5'],  
  },
  name: {
    fontSize: 32, // Increased from 27
    fontFamily: 'Roboto',
    fontWeight: 900,
    textTransform: 'uppercase',
    color: COLORS.slate900,
    letterSpacing: -1, 
    lineHeight: 1,
  },
  title: {
    fontSize: FONT_SIZE['xl'],
    color: COLORS.slate500, // Lighter than slate600 to match web font-light feel
    marginTop: SPACING['1.5'], 
    fontFamily: 'Roboto',
    fontWeight: 'normal', 
    letterSpacing: 0.5, 
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING['4'], 
    marginTop: SPACING['5'],
  },
  contactItem: {
    fontSize: FONT_SIZE['sm'], 
    color: COLORS.slate600,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  // Sections
  sectionContainer: {
    marginBottom: SPACING['5'], // Tightened
  },
  sectionTitle: {
    fontSize: FONT_SIZE['xs'], // Smaller like web
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: COLORS.slate400,
    letterSpacing: 3, // Drastically increased
    marginBottom: SPACING['2'],
  },
  
  // Content
  summaryText: {
    fontSize: 10, // Slightly smaller
    color: COLORS.slate700,
    lineHeight: 1.5, 
    textAlign: 'justify',
  },
  
  // Experience
  expList: {
    flexDirection: 'column',
    gap: SPACING['4'],
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 1,
  },
  role: {
    fontSize: 11,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: COLORS.slate900,
  },
  date: {
    fontSize: 9,
    color: COLORS.slate500,
  },
  company: {
    fontSize: 10,
    color: COLORS.slate600,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    fontSize: 9.5,
    color: COLORS.slate700,
    lineHeight: 1.5,
  },
  
  // Skills
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING['2'],
  },
  skillChip: {
    paddingHorizontal: 6,
    paddingVertical: 1, // Extremely tight
    backgroundColor: COLORS.slate100,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 4,
  },
  skillText: {
    fontSize: 8, // Smaller
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  
  // Education
  eduList: {
    flexDirection: 'column',
    gap: SPACING['3'],
  },
  eduItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  school: {
    fontSize: 11,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: COLORS.slate900,
  },
  degree: {
    fontSize: 9.5,
    color: COLORS.slate600,
  },
  eduDate: {
    fontSize: 9,
    color: COLORS.slate500,
  },
});

export const ModernTemplatePdf: React.FC<PdfTemplateProps> = ({ data }) => {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{data.fullName}</Text>
        <Text style={styles.title}>{data.title}</Text>
        <View style={styles.contactRow}>
          {data.email && (
             <View style={styles.contactItem}>
               <MailIconPdf size={12} color={COLORS.slate600} />
               <Text>{data.email}</Text>
             </View>
          )}
          {data.phone && (
             <View style={styles.contactItem}>
               <PhoneIconPdf size={12} color={COLORS.slate600} />
               <Text>{data.phone}</Text>
             </View>
          )}
          {data.location && (
             <View style={styles.contactItem}>
               <MapPinIconPdf size={12} color={COLORS.slate600} />
               <Text>{data.location}</Text>
             </View>
          )}
          {data.website && (
             <View style={styles.contactItem}>
               <GlobeIconPdf size={12} color={COLORS.slate600} />
               <Text>{data.website}</Text>
             </View>
          )}
          {data.linkedin && (
             <View style={styles.contactItem}>
               <LinkedinIconPdf size={12} color={COLORS.slate600} />
               <Text>{data.linkedin}</Text>
             </View>
          )}
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
