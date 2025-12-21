import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    'features',
    'quick-start',
    {
      type: 'category',
      label: 'Installation',
      link: {
        type: 'doc',
        id: 'installation/index',
      },
      items: ['installation/docker-compose', 'installation/backups'],
    },
    {
      type: 'category',
      label: 'Configuration',
      link: {
        type: 'generated-index',
        title: 'Configuration',
        description: 'Configure and customize your Agam Space instance.',
        slug: '/configuration',
      },
      items: [
        'configuration/first-steps',
        'configuration/sso',
        'configuration/trusted-devices',
        'configuration/user-management',
      ],
    },
    'security',
    'architecture',
    'faq',
  ],
};

export default sidebars;
