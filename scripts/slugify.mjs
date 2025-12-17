export const slugifyJobTitle = (title) =>
  String(title)
    .trim()
    .toLowerCase()
    .replace(/\bnode\.js\b/g, 'nodejs')
    .replace(/\breact\.js\b/g, 'reactjs')
    .replace(/\bnext\.js\b/g, 'nextjs')
    .replace(/\bvue\.js\b/g, 'vuejs')
    .replace(/\bnuxt\.js\b/g, 'nuxtjs')
    .replace(/\bexpress\.js\b/g, 'expressjs')
    .replace(/\.net\b/g, ' dotnet ')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/#/g, ' sharp ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

