#!/usr/bin/env node
/**
 * Submit sitemap to Google Search Console API
 *
 * Prerequisites:
 * 1. Create a Google Cloud Project
 * 2. Enable Search Console API
 * 3. Create a service account
 * 4. Add service account email to Search Console as site owner
 * 5. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in GitHub Secrets
 */

import { google } from 'googleapis';
import { promises as fs } from 'node:fs';

const SITE_URL = process.env.SITE_URL || 'https://genedai.cv';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Validate environment variables
if (!SERVICE_ACCOUNT_EMAIL) {
  console.error('❌ Error: GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable is required');
  process.exit(1);
}

if (!PRIVATE_KEY) {
  console.error('❌ Error: GOOGLE_PRIVATE_KEY environment variable is required');
  console.error('   Make sure to replace literal \\n with actual newlines in the secret');
  process.exit(1);
}

// Validate SITE_URL format
const normalizedSiteUrl = SITE_URL.replace(/\/$/, '');
if (!normalizedSiteUrl.startsWith('http://') && !normalizedSiteUrl.startsWith('https://')) {
  console.error(`❌ Error: Invalid SITE_URL format: ${SITE_URL}`);
  console.error('   SITE_URL must start with http:// or https://');
  process.exit(1);
}

/**
 * Submit sitemap to Google Search Console
 */
async function submitSitemap() {
  try {
    console.log(`📡 Starting sitemap submission for ${normalizedSiteUrl}...`);
    console.log('');

    // Create JWT client for service account authentication
    const auth = new google.auth.JWT(
      SERVICE_ACCOUNT_EMAIL,
      null,
      PRIVATE_KEY,
      ['https://www.googleapis.com/auth/webmasters']
    );

    // Create Search Console client
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    // Sitemap URL
    const sitemapUrl = `${normalizedSiteUrl}/sitemap.xml`;

    console.log(`📍 Sitemap URL: ${sitemapUrl}`);
    console.log('');

    // Submit sitemap
    console.log('📤 Submitting sitemap to Google Search Console...');
    const response = await searchconsole.sitemaps.submit({
      siteUrl: normalizedSiteUrl,
      feedpath: sitemapUrl,
    });

    console.log('✅ Sitemap submitted successfully!');
    console.log('');
    console.log('Response:', response.data);

    // Get sitemap information
    console.log('');
    console.log('📊 Retrieving sitemap information...');
    try {
      const sitemapInfo = await searchconsole.sitemaps.get({
        siteUrl: normalizedSiteUrl,
        feedpath: sitemapUrl,
      });

      console.log('✅ Sitemap information retrieved:');
      console.log(JSON.stringify(sitemapInfo.data, null, 2));
    } catch (error) {
      if (error.status === 404) {
        console.log('⚠️  Sitemap info not yet available (may take a few minutes to propagate)');
      } else {
        throw error;
      }
    }

    // List all sitemaps for the site
    console.log('');
    console.log('📋 Listing all sitemaps for the site...');
    try {
      const sitemapsList = await searchconsole.sitemaps.list({
        siteUrl: normalizedSiteUrl,
      });

      console.log(`✅ Found ${sitemapsList.data?.sitemap?.length || 0} sitemap(s):`);
      if (sitemapsList.data?.sitemap) {
        sitemapsList.data.sitemap.forEach((sitemap, index) => {
          console.log(`   ${index + 1}. ${sitemap.path}`);
          console.log(`      - Last submitted: ${sitemap.lastSubmitted}`);
          console.log(`      - Status: ${sitemap.contents?.[0]?.status || 'N/A'}`);
        });
      }
    } catch (error) {
      console.log('⚠️  Could not retrieve sitemap list:', error.message);
    }

    console.log('');
    console.log('🎉 Sitemap submission process completed!');
    console.log('');
    console.log('📝 Notes:');
    console.log('   - It may take several hours for Google to process the sitemap');
    console.log('   - Check Search Console for indexing status');
    console.log(`   - View at: https://search.google.com/search-console?resource_id=${normalizedSiteUrl}`);

  } catch (error) {
    console.error('');
    console.error('❌ Error submitting sitemap:');
    console.error(error.message);

    if (error.errors) {
      console.error('');
      console.error('Error details:');
      error.errors.forEach((err, index) => {
        console.error(`   ${index + 1}. ${err.message}`);
        if (err.reason) {
          console.error(`      Reason: ${err.reason}`);
        }
      });
    }

    if (error.status === 403) {
      console.error('');
      console.error('🔒 Authentication failed. Please ensure:');
      console.error('   1. Service account email is added as a site owner in Google Search Console');
      console.error(`   2. Service account email: ${SERVICE_ACCOUNT_EMAIL}`);
    }

    if (error.status === 404) {
      console.error('');
      console.error('❌ Site not found in Search Console. Please ensure:');
      console.error('   1. The site is verified in Google Search Console');
      console.error(`   2. SITE_URL is correct: ${normalizedSiteUrl}`);
    }

    process.exit(1);
  }
}

// Run the script
submitSitemap().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
