import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Features',
      link: {
        type: 'doc',
        id: 'features',
      },
      items: [
        'features/encryption',
        'features/account',
        'features/file-management',
        'features/public-sharing',
        'features/admin',
        'features/deployment',
        'features/roadmap',
      ],
    },
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
        'security/trust-model',
        'security/authentication',
        'security/encryption',
        'security/browser-security',
        'security/cmk-unlock',
        'security/recovery',
        'security/web-assets-integrity-verification',
      ],
    },
    'architecture',
    'faq',
  ],
};

export default sidebars;
