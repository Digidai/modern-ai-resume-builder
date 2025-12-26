import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PdfTemplateProps, COLORS } from './shared';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    fontFamily: 'Helvetica',
  },
  sidebar: {
    width: '33%',
    backgroundColor: COLORS.slate900,
    padding: 30,
    color: COLORS.slate200,
    height: '100%',
  },
  main: {
    width: '67%',
    padding: 30,
    backgroundColor: COLORS.white,
    color: COLORS.slate900,
  },
  // Sidebar styles
  sidebarName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    marginBottom: 4,
    lineHeight: 1.2,
  },
  sidebarTitle: {
    fontSize: 12,
    color: COLORS.indigo400,
    marginBottom: 20,
  },
  sidebarSection: {
    marginBottom: 24,
  },
  sidebarHeader: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate700,
    paddingBottom: 4,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  contactItem: {
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 7,
    color: COLORS.slate500,
    textTransform: 'uppercase',
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
  },
  contactValue: {
    fontSize: 9,
    color: COLORS.slate300,
    flexWrap: 'wrap',
  },
  skillChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillChip: {
    backgroundColor: COLORS.slate800,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  skillText: {
    fontSize: 8,
    color: COLORS.slate300,
  },
  eduItem: {
    marginBottom: 10,
  },
  eduSchool: {
    fontSize: 9,
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
  },
  eduDegree: {
    fontSize: 8,
    color: COLORS.slate400,
    marginBottom: 2,
  },
  eduDate: {
    fontSize: 8,
    color: COLORS.slate500,
  },
  // Main styles
  mainSection: {
    marginBottom: 20,
  },
  mainHeader: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate800,
    textTransform: 'uppercase',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainHeaderBar: {
    width: 24,
    height: 3,
    backgroundColor: COLORS.slate900,
    marginRight: 8,
  },
  summaryText: {
    fontSize: 10,
    color: COLORS.slate600,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  expList: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.slate100,
    paddingLeft: 16,
    marginLeft: 4,
  },
  expItem: {
    marginBottom: 16,
    position: 'relative',
  },
  expDot: {
    position: 'absolute',
    left: -21,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.slate200,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  role: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
    marginBottom: 2,
  },
  expMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  company: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.indigo600,
  },
  date: {
    fontSize: 10,
    color: COLORS.slate500,
  },
  description: {
    fontSize: 10,
    color: COLORS.slate600,
    lineHeight: 1.5,
  },
  projectItem: {
    backgroundColor: COLORS.slate50,
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
});

export const SidebarTemplatePdf: React.FC<PdfTemplateProps> = ({ data }) => {
  return (
    <Page size="A4" style={styles.page}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarName}>{data.fullName}</Text>
          <Text style={styles.sidebarTitle}>{data.title}</Text>
        </View>

        <View style={styles.sidebarSection}>
          {[
            { label: 'Email', value: data.email },
            { label: 'Phone', value: data.phone },
            { label: 'Location', value: data.location },
            { label: 'Portfolio', value: data.website },
            { label: 'LinkedIn', value: data.linkedin },
          ].map((item, i) => (
            item.value ? (
              <View key={i} style={styles.contactItem}>
                <Text style={styles.contactLabel}>{item.label}</Text>
                <Text style={styles.contactValue}>{item.value}</Text>
              </View>
            ) : null
          ))}
        </View>

        {data.skills.length > 0 && (
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarHeader}>Skills</Text>
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
            <Text style={styles.sidebarHeader}>Education</Text>
            {data.education.map((edu) => (
              <View key={edu.id} style={styles.eduItem}>
                <Text style={styles.eduSchool}>{edu.school}</Text>
                <Text style={styles.eduDegree}>{edu.degree}</Text>
                <Text style={styles.eduDate}>{edu.startDate} — {edu.endDate}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        {data.summary && (
          <View style={styles.mainSection}>
            <View style={styles.mainHeader}>
              <View style={styles.mainHeaderBar} />
              <Text>Profile</Text>
            </View>
            <Text style={styles.summaryText}>{data.summary}</Text>
          </View>
        )}

        {data.experience.length > 0 && (
          <View style={styles.mainSection}>
            <View style={styles.mainHeader}>
              <View style={styles.mainHeaderBar} />
              <Text>Experience</Text>
            </View>
            <View style={styles.expList}>
              {data.experience.map((exp) => (
                <View key={exp.id} style={styles.expItem} wrap={false}>
                  <View style={styles.expDot} />
                  <Text style={styles.role}>{exp.role}</Text>
                  <View style={styles.expMetaRow}>
                    <Text style={styles.company}>{exp.company}</Text>
                    <Text style={styles.date}>{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</Text>
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
              <View style={styles.mainHeaderBar} />
              <Text>Projects</Text>
            </View>
            {data.projects.map((proj) => (
              <View key={proj.id} style={styles.projectItem} wrap={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ ...styles.role, fontSize: 11 }}>{proj.name}</Text>
                  {proj.link && <Text style={{ fontSize: 9, color: COLORS.indigo600 }}>{proj.link}</Text>}
                </View>
                <Text style={styles.description}>{proj.description}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Page>
  );
};
