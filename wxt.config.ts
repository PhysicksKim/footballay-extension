import { defineConfig } from 'wxt';

export default defineConfig({
    srcDir: 'src',
    manifestVersion: 3,
    manifest: {
        name: 'Footballay',
        description: 'Compact live football stats overlay for streaming pages.',
        icons: {
            16: 'footballay_icon.png',
            32: 'footballay_icon.png',
            48: 'footballay_icon.png',
            128: 'footballay_icon.png',
        },
        action: {
            default_icon: {
                16: 'footballay_icon.png',
                32: 'footballay_icon.png',
                48: 'footballay_icon.png',
                128: 'footballay_icon.png',
            },
        },
        permissions: ['storage', 'activeTab', 'tabs'],
        host_permissions: [
            'https://api.footballay.com/*',
            'https://www.coupangplay.com/*',
            'https://www.spotvnow.co.kr/*',
        ],
        content_security_policy: {
            extension_pages: `script-src 'self'; font-src 'self' https://fonts.gstatic.com; object-src 'self';`,
        },
    },
});
