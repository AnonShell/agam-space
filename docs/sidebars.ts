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
        type: 'doc',
        id: 'configuration/index',
      },
      items: [
        'configuration/configuration-reference',
        'configuration/first-steps',
        'configuration/sso',
        'configuration/trusted-devices',
        'configuration/user-management',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      link: {
        type: 'doc',
        id: 'security/index',
      },
      items: [
        'security/authentication',
        'security/encryption',
        'security/cmk-unlock',
        'security/recovery',
      ],
    },
    'architecture',
    'faq',
  ],
};

export default sidebars;
