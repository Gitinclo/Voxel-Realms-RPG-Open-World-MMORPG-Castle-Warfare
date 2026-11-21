/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PermissiveSpdxLicense = 'Apache-2.0' | 'MIT' | 'BSD-3-Clause' | 'ISC';

export type AndroidLibraryCategory =
  | 'auth'
  | 'networking'
  | 'graphql'
  | 'media'
  | 'parsing'
  | 'documents'
  | 'localization'
  | 'platform';

export interface AndroidOpenSourceLibrary {
  readonly id: string;
  readonly name: string;
  readonly coordinate: string;
  readonly version: string;
  readonly tomlAlias: string;
  readonly license: PermissiveSpdxLicense;
  readonly copyrightHolder: string;
  readonly upstreamUrl: string;
  readonly category: AndroidLibraryCategory;
  readonly purpose: string;
}

const APACHE2_COMPATIBLE_LICENSES: ReadonlySet<string> = new Set<PermissiveSpdxLicense>([
  'Apache-2.0',
  'MIT',
  'BSD-3-Clause',
  'ISC',
]);

export const ANDROID_OPEN_SOURCE_LIBRARIES: readonly AndroidOpenSourceLibrary[] = Object.freeze([
  {
    id: 'appauth-android',
    name: 'AppAuth-Android',
    coordinate: 'net.openid:appauth',
    version: '0.11.1',
    tomlAlias: 'appauth-android',
    license: 'Apache-2.0',
    copyrightHolder: 'The AppAuth for Android Authors (OpenID Foundation)',
    upstreamUrl: 'https://github.com/openid/AppAuth-Android',
    category: 'auth',
    purpose:
      'RFC 8252 OAuth 2.0 / OpenID Connect (PKCE) sign-in and session bootstrap on Android without embedded WebViews.',
  },
  {
    id: 'apollo-graphql-client',
    name: 'Apollo GraphQL Client',
    coordinate: 'com.apollographql.apollo:apollo-runtime',
    version: '4.1.1',
    tomlAlias: 'apollo-runtime',
    license: 'MIT',
    copyrightHolder: 'Apollo Graph, Inc.',
    upstreamUrl: 'https://github.com/apollographql/apollo-kotlin',
    category: 'graphql',
    purpose:
      'Strongly typed Kotlin GraphQL runtime and normalized cache for nested RPG inventory, profile, and clan UI trees.',
  },
  {
    id: 'coil',
    name: 'Coil',
    coordinate: 'io.coil-kt.coil3:coil',
    version: '3.0.4',
    tomlAlias: 'coil-core',
    license: 'Apache-2.0',
    copyrightHolder: 'Coil Contributors',
    upstreamUrl: 'https://github.com/coil-kt/coil',
    category: 'media',
    purpose:
      'Coroutine-backed Android image loading with OkHttp transport and memory/disk caching for portraits, banners, and item icons.',
  },
  {
    id: 'android-gif-drawable',
    name: 'android-gif-drawable',
    coordinate: 'pl.droidsonroids.gif:android-gif-drawable',
    version: '1.2.29',
    tomlAlias: 'android-gif-drawable',
    license: 'MIT',
    copyrightHolder: 'Karol Wrótniak (Droids On Roids)',
    upstreamUrl: 'https://github.com/koral--/android-gif-drawable',
    category: 'media',
    purpose:
      'JNI-accelerated animated GIF decoding and Drawable rendering for emote reactions, skill previews, and world-boss banners.',
  },
  {
    id: 'androidsvg',
    name: 'AndroidSVG',
    coordinate: 'com.caverock:androidsvg-aar',
    version: '1.4',
    tomlAlias: 'androidsvg',
    license: 'Apache-2.0',
    copyrightHolder: 'Paul LeBeau (Cave Rock Software)',
    upstreamUrl: 'https://github.com/BigBadaboom/androidsvg',
    category: 'media',
    purpose:
      'Resolution-independent SVG 1.1 vector rendering for faction crests, clan emblems, and cosmological realm glyphs across DPIs.',
  },
  {
    id: 'jsoup',
    name: 'jsoup: Java HTML Parser',
    coordinate: 'org.jsoup:jsoup',
    version: '1.18.3',
    tomlAlias: 'jsoup',
    license: 'MIT',
    copyrightHolder: 'Jonathan Hedley',
    upstreamUrl: 'https://github.com/jhy/jsoup',
    category: 'parsing',
    purpose:
      'HTML5 DOM parsing and strict allowlist sanitization (Safelist) for patch notes, announcements, and in-game mail previews.',
  },
  {
    id: 'pdfviewpager',
    name: 'PdfViewPager',
    coordinate: 'es.voghdev.pdfviewpager:library',
    version: '1.1.2',
    tomlAlias: 'pdfviewpager',
    license: 'Apache-2.0',
    copyrightHolder: 'Olmo Gallegos Hernández (voghDev)',
    upstreamUrl: 'https://github.com/voghDev/PdfViewPager',
    category: 'documents',
    purpose:
      'Paged in-app PDF rendering for offline lore codices, legal notices (EULA/Privacy), and printable siege strategy guides.',
  },
  {
    id: 'lingver',
    name: 'Lingver',
    coordinate: 'com.github.YarikSOffice:lingver',
    version: '1.3.0',
    tomlAlias: 'lingver',
    license: 'Apache-2.0',
    copyrightHolder: 'Yaroslav Berezanskyi (YarikSOffice)',
    upstreamUrl: 'https://github.com/YarikSOffice/lingver',
    category: 'localization',
    purpose:
      'Runtime locale persistence and dynamic in-app multi-language switching on Android without modifying OS-wide settings.',
  },
  {
    id: 'okhttp',
    name: 'OkHttp',
    coordinate: 'com.squareup.okhttp3:okhttp',
    version: '4.12.0',
    tomlAlias: 'okhttp',
    license: 'Apache-2.0',
    copyrightHolder: 'Square, Inc.',
    upstreamUrl: 'https://github.com/square/okhttp',
    category: 'networking',
    purpose:
      'HTTP/2, TLS 1.3 connection pooling, certificate pinning, and RFC 6455 WebSocket transport (/ws/siege) for Android API traffic.',
  },
  {
    id: 'aosp',
    name: 'Android Open Source Project',
    coordinate: 'androidx.core:core-ktx',
    version: '1.15.0',
    tomlAlias: 'androidx-core-ktx',
    license: 'Apache-2.0',
    copyrightHolder: 'The Android Open Source Project (Google LLC)',
    upstreamUrl: 'https://source.android.com/',
    category: 'platform',
    purpose:
      'Core Android platform APIs, AndroidX Jetpack lifecycle/compat utilities, Vulkan/NDK surface integration, and hardware Keystore primitives.',
  },
]);

export function isApache2CompatibleLicense(spdxId: string): boolean {
  return APACHE2_COMPATIBLE_LICENSES.has(spdxId);
}

export interface AndroidCatalogValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

export function validateAndroidDependencyCatalog(
  libraries: readonly AndroidOpenSourceLibrary[] = ANDROID_OPEN_SOURCE_LIBRARIES
): AndroidCatalogValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenCoordinates = new Set<string>();

  for (const lib of libraries) {
    if (!lib.id.trim() || !lib.name.trim()) {
      errors.push(`Library entry has empty id or name: ${JSON.stringify(lib)}`);
    }
    if (seenIds.has(lib.id)) {
      errors.push(`Duplicate Android library id: ${lib.id}`);
    }
    seenIds.add(lib.id);

    if (seenCoordinates.has(lib.coordinate)) {
      errors.push(`Duplicate Maven coordinate: ${lib.coordinate}`);
    }
    seenCoordinates.add(lib.coordinate);

    if (!isApache2CompatibleLicense(lib.license)) {
      errors.push(`${lib.name} declares non-permissive license "${lib.license}"`);
    }
    if (!/^https:\/\//.test(lib.upstreamUrl)) {
      errors.push(`${lib.name} upstreamUrl must use https:// (got "${lib.upstreamUrl}")`);
    }
    if (!/^[a-z0-9._-]+:[a-z0-9._-]+$/i.test(lib.coordinate)) {
      errors.push(`${lib.name} has malformed group:artifact coordinate "${lib.coordinate}"`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
