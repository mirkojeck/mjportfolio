window.__MJ_PREVIEW_FILE_EXECUTED_FIRST_LINE__ = true;

(function () {
  var attempts = 0;
  var maxAttempts = 80;
  var PREVIEW_DEBUG = false;

  function debugLog() {
    if (!PREVIEW_DEBUG || !window.console) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[MJ PREVIEW]');
    console.log.apply(console, args);
  }

  function unwrapValue(value) {
    if (!value) return '';
    if (value && typeof value.toJS === 'function') value = value.toJS();

    if (value && typeof value === 'object') {
      if (value.image) return unwrapValue(value.image);
      if (value.url) return unwrapValue(value.url);
      if (value.path) return unwrapValue(value.path);
      if (value.src) return unwrapValue(value.src);
      if (value.file) return unwrapValue(value.file);
      if (value.value) return unwrapValue(value.value);
    }

    return typeof value === 'string' ? value : '';
  }

  function normalizeAssetPath(value) {
    if (!value) return '';
    if (value.indexOf('public/') === 0) return value.replace(/^public/, '');
    if (value.indexOf('img/') === 0) return '/' + value;
    if (value.indexOf('./public/') === 0) return value.replace(/^\.\/public/, '');
    if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0 || value.indexOf('/') === 0) return value;
    return value;
  }

  function makeAssetUrl(getAsset, rawValue) {
    var value = unwrapValue(rawValue);
    if (!value) return '';

    var asset = getAsset(value);
    if (asset && typeof asset.toJS === 'function') asset = asset.toJS();
    if (asset && asset.url) return asset.url;
    if (asset && asset.path) return asset.path;
    if (asset && asset.src) return asset.src;
    if (asset && asset.toString) {
      var output = asset.toString();
      if (output && output !== '[object Object]') return output;
    }

    var normalized = normalizeAssetPath(value);
    if (normalized !== value) {
      asset = getAsset(normalized);
      if (asset && asset.toString) {
        var normalizedOutput = asset.toString();
        if (normalizedOutput && normalizedOutput !== '[object Object]') return normalizedOutput;
      }
    }

    return normalized;
  }

  function plainData(entry) {
    if (!entry || typeof entry.get !== 'function') return {};
    var raw = entry.get('data');
    if (!raw) return {};
    return typeof raw.toJS === 'function' ? raw.toJS() : raw;
  }

  function getCollectionName(props) {
    var collection = props && props.collection;
    if (!collection) return '';
    if (typeof collection.get === 'function') return collection.get('name') || '';
    return collection.name || '';
  }

  function getEntrySlug(entry) {
    if (!entry || typeof entry.get !== 'function') return '';
    return entry.get('slug') || '';
  }

  function getEntryPath(entry) {
    if (!entry || typeof entry.get !== 'function') return '';
    return entry.get('path') || '';
  }

  function pathJoin(parent, key) {
    if (!parent) return String(key);
    return parent + '.' + key;
  }

  function titleFromData(data, fallback) {
    if (!data) return fallback || 'Untitled entry';
    return data.title || data.name || data.heading || data.label || fallback || 'Untitled entry';
  }

  function summaryFromData(data, fallback) {
    if (!data) return fallback || 'No summary available.';
    return data.summary || data.excerpt || data.description || data.quote || data.role || fallback || 'No summary available.';
  }

  function valueToString(value) {
    if (value === undefined || value === null || value === '') return 'Not set';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.length + ' item(s)';
    if (typeof value === 'object') return 'Object';
    return String(value);
  }

  function firstImageInObject(value) {
    if (!value) return '';

    if (typeof value === 'string') {
      var lower = value.toLowerCase();
      if (
        lower.indexOf('.jpg') !== -1 ||
        lower.indexOf('.jpeg') !== -1 ||
        lower.indexOf('.png') !== -1 ||
        lower.indexOf('.webp') !== -1 ||
        lower.indexOf('.svg') !== -1 ||
        lower.indexOf('/img/') !== -1
      ) {
        return value;
      }
      return '';
    }

    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i += 1) {
        var foundInArray = firstImageInObject(value[i]);
        if (foundInArray) return foundInArray;
      }
      return '';
    }

    if (typeof value === 'object') {
      var keys = Object.keys(value);
      for (var k = 0; k < keys.length; k += 1) {
        var key = keys[k];
        if (key === 'image' || key === 'cover' || key === 'avatar' || key === 'photo' || key === 'logo' || key === 'src') {
          var direct = unwrapValue(value[key]);
          if (direct) return direct;
        }
      }

      for (var j = 0; j < keys.length; j += 1) {
        var foundNested = firstImageInObject(value[keys[j]]);
        if (foundNested) return foundNested;
      }
    }

    return '';
  }

  function hasSeoFields(data) {
    if (!data || typeof data !== 'object') return false;
    return !!(data.seo || data.seoTitle || data.seoDescription || data.canonicalBaseUrl);
  }

  function readSeoData(data) {
    var seo = data && data.seo ? data.seo : {};
    return {
      title: seo.title || data.seoTitle || '',
      description: seo.description || data.seoDescription || '',
      canonical: seo.canonicalBaseUrl || data.canonicalBaseUrl || '',
      image: seo.image || data.cover || data.image || '',
    };
  }

  function createFieldTracker() {
    var handled = {};

    function mark(path) {
      if (!path) return;
      handled[path] = true;
    }

    function markMany(paths) {
      (paths || []).forEach(mark);
    }

    function isHandled(path) {
      return !!handled[path];
    }

    function getHandled() {
      return handled;
    }

    return {
      mark: mark,
      markMany: markMany,
      isHandled: isHandled,
      getHandled: getHandled,
    };
  }

  function collectLeafFields(data, prefix, output) {
    var out = output || [];
    var base = prefix || '';

    if (data === null || data === undefined) {
      out.push({ path: base || '(root)', value: 'Not set' });
      return out;
    }

    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      out.push({ path: base || '(root)', value: String(data) });
      return out;
    }

    if (Array.isArray(data)) {
      if (!data.length) {
        out.push({ path: base || '(root)', value: '[]' });
        return out;
      }

      for (var i = 0; i < data.length; i += 1) {
        collectLeafFields(data[i], (base ? base : 'items') + '[' + i + ']', out);
      }
      return out;
    }

    var keys = Object.keys(data);
    if (!keys.length) {
      out.push({ path: base || '(root)', value: '{}' });
      return out;
    }

    for (var k = 0; k < keys.length; k += 1) {
      var key = keys[k];
      collectLeafFields(data[key], pathJoin(base, key), out);
    }

    return out;
  }

  function bootPreview() {
    attempts += 1;

    var renderer = (window.React && window.React.createElement) || window.h;

    if (!window.CMS || !renderer) {
      if (attempts < maxAttempts) {
        window.setTimeout(bootPreview, 100);
      } else {
        console.warn('MJ admin preview failed to boot: CMS or renderer was not available.');
      }
      return;
    }

    if (window.__MJ_ADMIN_PREVIEW_REGISTERED__) return;
    window.__MJ_ADMIN_PREVIEW_REGISTERED__ = true;

    var h = renderer;

    window.CMS.registerPreviewStyle('/mj-admin/preview.css?v=1002');

    function EmptyPreview(message) {
      return h('div', { className: 'mj-pv-empty' }, message || 'No data available yet.');
    }

    function PreviewShell(children, modifier) {
      return h('article', { className: 'mj-pv-shell ' + (modifier || '') }, children);
    }

    function PreviewHeader(opts) {
      return h('header', { className: 'mj-pv-header' },
        h('p', { className: 'mj-pv-header__eyebrow' }, opts.eyebrow || 'Preview'),
        h('h1', { className: 'mj-pv-header__title' }, opts.title || 'Untitled entry'),
        h('p', { className: 'mj-pv-header__summary' }, opts.summary || 'No summary available.')
      );
    }

    function PermalinkHint(pathname) {
      if (!pathname) return null;
      return h('div', { className: 'mj-pv-permalink' },
        h('strong', null, 'Permalink'),
        h('span', null, pathname)
      );
    }

    function PreviewSection(title, body, levelClass) {
      return h('section', { className: 'mj-pv-section ' + (levelClass || '') },
        h('h2', { className: 'mj-pv-section__title' }, title),
        body
      );
    }

    function PreviewGrid(items) {
      return h('div', { className: 'mj-pv-grid' }, items);
    }

    function FieldCard(label, value) {
      return h('div', { className: 'mj-pv-field' },
        h('span', { className: 'mj-pv-field__label' }, label),
        h('span', { className: 'mj-pv-field__value' }, valueToString(value))
      );
    }

    function MetaRow(label, value) {
      return h('div', { className: 'mj-pv-meta-row' },
        h('span', { className: 'mj-pv-meta-row__label' }, label),
        h('span', { className: 'mj-pv-meta-row__value' }, valueToString(value))
      );
    }

    function ImagePreview(getAsset, rawValue, alt, className) {
      var src = makeAssetUrl(getAsset, rawValue);
      if (!src) return EmptyPreview('No image selected');

      return h('div', { className: 'mj-pv-image ' + (className || '') },
        h('img', {
          src: src,
          alt: alt || '',
          onError: function (event) {
            var image = event.currentTarget;
            if (!image || image.dataset.previewBroken) return;
            image.dataset.previewBroken = 'true';
            image.style.display = 'none';
            if (image.parentNode) image.parentNode.classList.add('mj-pv-image--broken');
          },
        }),
        h('span', { className: 'mj-pv-image__broken-label' }, 'Image preview unavailable')
      );
    }

    function ArrayList(items, mapper, emptyText) {
      if (!items || !items.length) {
        return EmptyPreview(emptyText || 'No items configured');
      }

      return h('div', { className: 'mj-pv-list' },
        items.map(function (item, index) {
          return h('div', { className: 'mj-pv-list__item', key: 'item-' + index }, mapper(item, index));
        })
      );
    }

    function renderNestedValue(value, path, tracker, getAsset) {
      if (value === null || value === undefined || value === '') {
        tracker.mark(path);
        return h('span', { className: 'mj-pv-audit-value' }, 'Not set');
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        tracker.mark(path);
        return h('span', { className: 'mj-pv-audit-value' }, String(value));
      }

      if (Array.isArray(value)) {
        tracker.mark(path);
        if (!value.length) return h('span', { className: 'mj-pv-audit-value' }, '[]');

        return h('div', { className: 'mj-pv-audit-array' },
          value.map(function (item, index) {
            var itemPath = path + '[' + index + ']';
            return h('div', { className: 'mj-pv-audit-array__item', key: itemPath },
              h('p', { className: 'mj-pv-audit-array__index' }, '#' + (index + 1)),
              renderNestedValue(item, itemPath, tracker, getAsset)
            );
          })
        );
      }

      var keys = Object.keys(value);
      if (!keys.length) {
        tracker.mark(path);
        return h('span', { className: 'mj-pv-audit-value' }, '{}');
      }

      return h('div', { className: 'mj-pv-audit-object' },
        keys.map(function (key) {
          var childPath = pathJoin(path, key);
          var child = value[key];
          var imageCandidate = unwrapValue(child);
          var maybeImage = firstImageInObject(imageCandidate) || imageCandidate;
          var hasImage = typeof maybeImage === 'string' && maybeImage && (
            maybeImage.toLowerCase().indexOf('.jpg') !== -1 ||
            maybeImage.toLowerCase().indexOf('.jpeg') !== -1 ||
            maybeImage.toLowerCase().indexOf('.png') !== -1 ||
            maybeImage.toLowerCase().indexOf('.webp') !== -1 ||
            maybeImage.toLowerCase().indexOf('.svg') !== -1 ||
            maybeImage.indexOf('/img/') !== -1
          );

          return h('div', { className: 'mj-pv-audit-object__row', key: childPath },
            h('p', { className: 'mj-pv-audit-object__key' }, key),
            hasImage
              ? h('div', { className: 'mj-pv-audit-object__media' }, [
                  ImagePreview(getAsset, maybeImage, key, 'mj-pv-image--audit'),
                  renderNestedValue(child, childPath, tracker, getAsset),
                ])
              : renderNestedValue(child, childPath, tracker, getAsset)
          );
        })
      );
    }

    function DataAuditPreview(data, tracker, getAsset, title) {
      var keys = Object.keys(data || {});
      if (!keys.length) return EmptyPreview('No fields available for audit');

      return PreviewSection(title || 'Data Audit Preview',
        h('div', { className: 'mj-pv-audit' },
          keys.map(function (key) {
            var path = key;
            return h('div', { className: 'mj-pv-audit-group', key: path },
              h('h3', { className: 'mj-pv-audit-group__title' }, key),
              renderNestedValue(data[key], path, tracker, getAsset)
            );
          })
        ),
        'mj-pv-section--audit'
      );
    }

    function FieldAuditPreview(data, tracker) {
      var leaves = collectLeafFields(data, '', []);
      var missing = leaves.filter(function (item) {
        return !tracker.isHandled(item.path);
      });

      return PreviewSection('Other Fields / Field Audit',
        missing.length
          ? h('div', { className: 'mj-pv-field-audit' },
              missing.map(function (item) {
                return h('div', { className: 'mj-pv-field-audit__row', key: item.path },
                  h('span', { className: 'mj-pv-field-audit__path' }, item.path),
                  h('span', { className: 'mj-pv-field-audit__value' }, item.value)
                );
              })
            )
          : h('div', { className: 'mj-pv-empty' }, 'All leaf fields are represented in Visual or Data Audit sections.'),
        'mj-pv-section--audit'
      );
    }

    function SEOPreview(getAsset, data, tracker) {
      var seo = readSeoData(data || {});
      tracker.markMany(['seo', 'seo.title', 'seo.description', 'seo.canonicalBaseUrl', 'seo.image', 'seoTitle', 'seoDescription', 'canonicalBaseUrl']);

      if (!seo.title && !seo.description && !seo.canonical && !seo.image) {
        return EmptyPreview('No SEO fields configured');
      }

      return h('div', { className: 'mj-pv-seo' },
        h('p', { className: 'mj-pv-seo__canonical' }, seo.canonical || 'Canonical URL not set'),
        h('h3', { className: 'mj-pv-seo__title' }, seo.title || 'SEO title not set'),
        h('p', { className: 'mj-pv-seo__description' }, seo.description || 'SEO description not set'),
        seo.image ? ImagePreview(getAsset, seo.image, seo.title || 'SEO image', 'mj-pv-image--seo') : null
      );
    }

    function genericBody(props, options) {
      var entry = props.entry;
      var data = plainData(entry);
      var collection = getCollectionName(props) || (options && options.collectionName) || 'content';
      var slug = getEntrySlug(entry);
      var path = getEntryPath(entry);
      var label = options && options.label ? options.label : (collection + ' preview');
      var title = options && options.title ? options.title : titleFromData(data, 'Untitled entry');
      var summary = options && options.summary ? options.summary : summaryFromData(data, 'Live preview generated from saved CMS fields.');
      var image = options && options.image ? options.image : (data.cover || data.image || firstImageInObject(data));
      var permalink = (options && options.permalink) || (slug ? '/' + collection + '/' + slug + '/' : (path || '/' + collection + '/{slug}/'));
      var tracker = createFieldTracker();

      tracker.markMany(['title', 'name', 'heading', 'label', 'summary', 'excerpt', 'description', 'quote', 'role', 'cover', 'image']);

      debugLog('render', {
        component: options && options.component ? options.component : 'GenericPreview',
        collection: collection,
        slug: slug,
        path: path,
        dataKeys: Object.keys(data || {}),
      });

      return PreviewShell([
        PreviewHeader({ eyebrow: label, title: title, summary: summary }),
        PermalinkHint(permalink),
        PreviewSection('Visual Preview',
          h('div', { className: 'mj-pv-visual' }, [
            ImagePreview(props.getAsset, image, title, 'mj-pv-image--hero'),
            PreviewGrid([
              FieldCard('Collection', collection),
              FieldCard('Slug', slug || 'Not set'),
              FieldCard('Path', path || 'Not set'),
              FieldCard('Primary title', title),
            ]),
          ])
        ),
        DataAuditPreview(data, tracker, props.getAsset, 'Data Audit Preview'),
        hasSeoFields(data) ? PreviewSection('SEO', SEOPreview(props.getAsset, data, tracker)) : null,
        FieldAuditPreview(data, tracker),
      ]);
    }

    function GalleryPreview(props) {
      var data = plainData(props.entry);
      var gallery = data.gallery || [];
      var cover = gallery.find(function (item) { return item && item.useAsCover; }) || gallery[0];
      var tags = data.tags || [];
      var tracker = createFieldTracker();

      tracker.markMany([
        'title', 'date', 'excerpt', 'gallery', 'tags', 'order', 'isFeatured', 'seoTitle', 'seoDescription', 'body',
      ]);

      return PreviewShell([
        PreviewHeader({
          eyebrow: 'Gallery / Case Study Preview',
          title: titleFromData(data, 'Untitled gallery'),
          summary: summaryFromData(data, 'Add a short visual summary for this gallery.'),
        }),
        PermalinkHint(getEntrySlug(props.entry) ? '/gallery/' + getEntrySlug(props.entry) + '/' : '/gallery/{slug}/'),
        PreviewSection('Visual Preview',
          h('div', { className: 'mj-pv-visual' }, [
            ImagePreview(props.getAsset, cover && cover.image ? cover.image : firstImageInObject(cover), data.title || 'Gallery cover', 'mj-pv-image--hero'),
            h('div', { className: 'mj-pv-meta-list' }, [
              MetaRow('Images', gallery.length),
              MetaRow('Featured', data.isFeatured ? 'Yes' : 'No'),
              MetaRow('Order', data.order || 999),
              MetaRow('Date', data.date || 'Not set'),
              MetaRow('Tags', tags.length ? tags.join(', ') : 'None'),
            ]),
            PreviewSection('Gallery Thumbnails', ArrayList(gallery, function (item, index) {
              tracker.markMany([
                'gallery[' + index + ']',
                'gallery[' + index + '].image',
                'gallery[' + index + '].useAsCover',
                'gallery[' + index + '].alt',
                'gallery[' + index + '].caption',
              ]);

              return h('div', { className: 'mj-pv-thumb ' + (item && item.useAsCover ? 'mj-pv-thumb--cover' : '') }, [
                ImagePreview(props.getAsset, item && item.image ? item.image : item, (item && (item.alt || item.caption)) || 'Gallery image', ''),
                item && item.useAsCover ? h('span', { className: 'mj-pv-thumb__badge' }, 'Cover') : null,
                h('div', { className: 'mj-pv-thumb__meta' }, [
                  MetaRow('Alt', item && item.alt ? item.alt : 'Not set'),
                  MetaRow('Caption', item && item.caption ? item.caption : 'Not set'),
                ]),
              ]);
            }, 'No gallery images yet')),
          ])
        ),
        DataAuditPreview(data, tracker, props.getAsset, 'Data Audit Preview'),
        hasSeoFields(data) ? PreviewSection('SEO', SEOPreview(props.getAsset, data, tracker)) : null,
        FieldAuditPreview(data, tracker),
      ]);
    }

    function HomePreview(props) {
      var data = plainData(props.entry);
      var hero = data.hero || {};
      var about = data.about || {};
      var servicesPreview = data.servicesPreview || {};
      var teamPreview = data.teamPreview || {};
      var blogPreview = data.blogPreview || {};
      var tracker = createFieldTracker();

      tracker.markMany([
        'hero', 'about', 'servicesPreview', 'teamPreview', 'reviews', 'partners', 'blogPreview', 'callToAction', 'featuredProjects',
      ]);

      return PreviewShell([
        PreviewHeader({
          eyebrow: 'Home Preview',
          title: [hero.titlePart1, hero.titleThin1, hero.titlePart2, hero.titleThin2].filter(Boolean).join(' ') || 'Home page',
          summary: hero.description || 'Homepage hero and section summaries.',
        }),
        PermalinkHint('/'),
        PreviewSection('Visual Preview',
          h('div', { className: 'mj-pv-visual' }, [
            ImagePreview(props.getAsset, about.image || hero.image || firstImageInObject(data), 'Home hero', 'mj-pv-image--hero'),
            PreviewGrid([
              FieldCard('Hero CTA', hero.ctaLabel),
              FieldCard('Hero secondary CTA', hero.secondaryCtaLabel),
              FieldCard('Services heading', servicesPreview.titleLine1 || servicesPreview.heading),
              FieldCard('Team heading', teamPreview.titlePart1 || teamPreview.heading),
              FieldCard('Latest Creations heading', blogPreview.heading),
            ]),
          ])
        ),
        DataAuditPreview(data, tracker, props.getAsset, 'Data Audit Preview'),
        hasSeoFields(data) ? PreviewSection('SEO', SEOPreview(props.getAsset, data, tracker)) : null,
        FieldAuditPreview(data, tracker),
      ]);
    }

    function SiteSettingsPreview(props) {
      var data = plainData(props.entry);
      var brand = data.brand || {};
      var logo = brand.logo || {};
      var logoImages = logo.images || {};
      var logoDisplay = logo.display || {};
      var display = data.display || {};
      var projects = data.projects || {};
      var gallery = data.gallery || {};
      var contact = data.contact || {};
      var socials = data.socials || [];
      var legalLinks = data.legalLinks || [];
      var tracker = createFieldTracker();

      tracker.markMany([
        'brand', 'brand.name', 'brand.shortName', 'brand.logoText', 'brand.domain',
        'brand.logo', 'brand.logo.alt', 'brand.logo.images', 'brand.logo.display',
        'display', 'seo', 'projects', 'gallery', 'contact', 'socials', 'legalLinks',
      ]);

      return PreviewShell([
        PreviewHeader({
          eyebrow: 'Site Settings Preview',
          title: brand.name || titleFromData(data, 'Site settings'),
          summary: summaryFromData(data, 'Global site settings verification before publish.'),
        }),
        PermalinkHint('/'),

        PreviewSection('Visual Preview',
          h('div', { className: 'mj-pv-visual' }, [
            ImagePreview(props.getAsset, logoImages.light || logoImages.dark || logoImages.footer || logoImages.fallback || firstImageInObject(data), brand.name || 'Logo', 'mj-pv-image--hero'),
            PreviewGrid([
              FieldCard('Site Name', brand.name),
              FieldCard('Short Header', brand.shortName),
              FieldCard('Footer Text Logo', brand.logoText),
              FieldCard('Domain', brand.domain),
            ]),
          ])
        ),

        PreviewSection('Brand', PreviewGrid([
          FieldCard('Site Name', brand.name),
          FieldCard('Short Header', brand.shortName),
          FieldCard('Footer Text Logo', brand.logoText),
          FieldCard('Domain', brand.domain),
        ])),

        PreviewSection('All Logo Variants and Logo Display Settings',
          h('div', { className: 'mj-pv-logo-variants' }, [
            h('div', { className: 'mj-pv-logo-variant' }, [
              h('h3', { className: 'mj-pv-subtitle' }, 'Light Logo'),
              ImagePreview(props.getAsset, logoImages.light, logo.alt || 'Light logo', 'mj-pv-image--logo'),
            ]),
            h('div', { className: 'mj-pv-logo-variant' }, [
              h('h3', { className: 'mj-pv-subtitle' }, 'Dark Logo'),
              ImagePreview(props.getAsset, logoImages.dark, logo.alt || 'Dark logo', 'mj-pv-image--logo'),
            ]),
            h('div', { className: 'mj-pv-logo-variant' }, [
              h('h3', { className: 'mj-pv-subtitle' }, 'Footer Logo Override'),
              ImagePreview(props.getAsset, logoImages.footer, logo.alt || 'Footer logo', 'mj-pv-image--logo'),
            ]),
            h('div', { className: 'mj-pv-logo-variant' }, [
              h('h3', { className: 'mj-pv-subtitle' }, 'Fallback Logo'),
              ImagePreview(props.getAsset, logoImages.fallback, logo.alt || 'Fallback logo', 'mj-pv-image--logo'),
            ]),
            h('div', { className: 'mj-pv-meta-list' }, [
              MetaRow('Alt Text', logo.alt),
              MetaRow('Height', logoDisplay.height),
              MetaRow('Zoom', logoDisplay.scale),
              MetaRow('Move X', logoDisplay.positionX),
              MetaRow('Move Y', logoDisplay.positionY),
              MetaRow('Fit Mode', logoDisplay.objectFit),
            ]),
          ])
        ),

        PreviewSection('Layout Sections', PreviewGrid([
          FieldCard('Active Home Variant', display.homeVariant),
          FieldCard('Active Portfolio Layout', display.portfolioLayout),
        ])),

        PreviewSection('SEO', SEOPreview(props.getAsset, data, tracker)),

        PreviewSection('Projects Display', PreviewGrid([
          FieldCard('Sort Direction', projects.sortDirection),
          FieldCard('Featured Limit', projects.featuredLimit),
        ])),

        PreviewSection('Gallery Display', PreviewGrid([
          FieldCard('Home Gallery Limit', gallery.homeLimit),
        ])),

        PreviewSection('Contact', h('div', { className: 'mj-pv-meta-list' }, [
          MetaRow('Email', contact.email),
          MetaRow('Phone', contact.phone),
          MetaRow('Locations Count', (contact.locations || []).length),
          ArrayList(contact.locations || [], function (item, index) {
            tracker.markMany([
              'contact.locations[' + index + ']',
              'contact.locations[' + index + '].label',
              'contact.locations[' + index + '].address',
              'contact.locations[' + index + '].phone',
            ]);

            return h('div', { className: 'mj-pv-list-card' }, [
              FieldCard('Label', item.label),
              FieldCard('Address', item.address),
              FieldCard('Phone', item.phone),
            ]);
          }, 'No locations configured'),
        ])),

        PreviewSection('Social Links, each item visible',
          ArrayList(socials, function (item, index) {
            tracker.markMany([
              'socials[' + index + ']',
              'socials[' + index + '].platform',
              'socials[' + index + '].label',
              'socials[' + index + '].href',
            ]);

            return h('div', { className: 'mj-pv-list-card' }, [
              FieldCard('Platform', item.platform),
              FieldCard('Label', item.label),
              FieldCard('URL', item.href),
            ]);
          }, 'No social links configured')
        ),

        PreviewSection('Legal Links, each item visible',
          ArrayList(legalLinks, function (item, index) {
            tracker.markMany([
              'legalLinks[' + index + ']',
              'legalLinks[' + index + '].label',
              'legalLinks[' + index + '].href',
            ]);

            return h('div', { className: 'mj-pv-list-card' }, [
              FieldCard('Label', item.label),
              FieldCard('URL', item.href),
            ]);
          }, 'No legal links configured')
        ),

        PreviewSection('Footer Mock',
          h('div', { className: 'mj-pv-footer-mock' }, [
            h('div', { className: 'mj-pv-footer-mock__bar' }, [
              h('span', { className: 'mj-pv-footer-mock__logo' }, brand.logoText || brand.shortName || brand.name || 'Logo'),
              h('span', { className: 'mj-pv-footer-mock__links' }, (legalLinks || []).map(function (link) {
                return link.label;
              }).join(' • ') || 'No legal links'),
            ]),
            h('p', { className: 'mj-pv-footer-mock__meta' }, contact.email || contact.phone || 'Contact info not set'),
          ])
        ),

        DataAuditPreview(data, tracker, props.getAsset, 'Data Audit Preview'),
        FieldAuditPreview(data, tracker),
      ], 'mj-pv-shell--settings');
    }

    function ServicesPreview(props) {
      var data = plainData(props.entry);
      var tracker = createFieldTracker();
      tracker.markMany(['title', 'summary', 'features', 'process', 'order', 'seoTitle', 'seoDescription']);

      return PreviewShell([
        PreviewHeader({
          eyebrow: 'Service Preview',
          title: titleFromData(data, 'Untitled service'),
          summary: summaryFromData(data, 'Service card and detail summary.'),
        }),
        PermalinkHint(getEntrySlug(props.entry) ? '/services/' + getEntrySlug(props.entry) + '/' : '/services/{slug}/'),
        PreviewSection('Visual Preview',
          h('div', { className: 'mj-pv-visual' }, [
            ImagePreview(props.getAsset, data.cover || data.image || firstImageInObject(data), data.title || 'Service image', 'mj-pv-image--hero'),
            PreviewGrid([
              FieldCard('Title', data.title),
              FieldCard('Summary', data.summary),
              FieldCard('Order', data.order),
              FieldCard('Features Count', (data.features || []).length),
            ]),
          ])
        ),
        PreviewSection('Process Steps',
          ArrayList(data.process || [], function (item, index) {
            tracker.markMany([
              'process[' + index + ']',
              'process[' + index + '].title',
              'process[' + index + '].description',
            ]);
            return h('div', { className: 'mj-pv-list-card' }, [
              FieldCard('Step Title', item.title),
              FieldCard('Step Description', item.description),
            ]);
          }, 'No process steps configured')
        ),
        DataAuditPreview(data, tracker, props.getAsset, 'Data Audit Preview'),
        hasSeoFields(data) ? PreviewSection('SEO', SEOPreview(props.getAsset, data, tracker)) : null,
        FieldAuditPreview(data, tracker),
      ]);
    }

    function TeamPreview(props) {
      var data = plainData(props.entry);
      var tracker = createFieldTracker();
      tracker.markMany(['name', 'role', 'image', 'socials', 'order', 'seoTitle', 'seoDescription']);

      return PreviewShell([
        PreviewHeader({
          eyebrow: 'Team Preview',
          title: data.name || titleFromData(data, 'Untitled team member'),
          summary: data.role || summaryFromData(data, 'Team member card preview.'),
        }),
        PermalinkHint('/team/'),
        PreviewSection('Visual Preview',
          h('div', { className: 'mj-pv-visual' }, [
            ImagePreview(props.getAsset, data.image || data.avatar, data.name || 'Team portrait', 'mj-pv-image--hero'),
            PreviewGrid([
              FieldCard('Name', data.name),
              FieldCard('Role', data.role),
              FieldCard('Order', data.order),
            ]),
          ])
        ),
        PreviewSection('Social Links, each item visible',
          ArrayList(data.socials || [], function (item, index) {
            tracker.markMany([
              'socials[' + index + ']',
              'socials[' + index + '].platform',
              'socials[' + index + '].label',
              'socials[' + index + '].href',
            ]);

            return h('div', { className: 'mj-pv-list-card' }, [
              FieldCard('Platform', item.platform),
              FieldCard('Label', item.label),
              FieldCard('URL', item.href),
            ]);
          }, 'No social links configured')
        ),
        DataAuditPreview(data, tracker, props.getAsset, 'Data Audit Preview'),
        hasSeoFields(data) ? PreviewSection('SEO', SEOPreview(props.getAsset, data, tracker)) : null,
        FieldAuditPreview(data, tracker),
      ]);
    }

    function ProjectsPreview(props) {
      var data = plainData(props.entry);
      var tracker = createFieldTracker();
      tracker.markMany(['title', 'summary', 'cover', 'detailLayout', 'gallery', 'client', 'year', 'date', 'services', 'externalUrl', 'order', 'isFeatured', 'seoTitle', 'seoDescription', 'body']);

      return PreviewShell([
        PreviewHeader({
          eyebrow: 'Project Preview',
          title: titleFromData(data, 'Untitled project'),
          summary: summaryFromData(data, 'Project card and detail preview.'),
        }),
        PermalinkHint(getEntrySlug(props.entry) ? '/projects/' + getEntrySlug(props.entry) + '/' : '/projects/{slug}/'),
        PreviewSection('Visual Preview',
          h('div', { className: 'mj-pv-visual' }, [
            ImagePreview(props.getAsset, data.cover || firstImageInObject(data.gallery), data.title || 'Project cover', 'mj-pv-image--hero'),
            PreviewGrid([
              FieldCard('Client', data.client),
              FieldCard('Year', data.year),
              FieldCard('Detail Layout', data.detailLayout),
              FieldCard('Featured', data.isFeatured ? 'Yes' : 'No'),
            ]),
          ])
        ),
        PreviewSection('Project Gallery',
          ArrayList(data.gallery || [], function (item, index) {
            tracker.markMany([
              'gallery[' + index + ']',
              'gallery[' + index + '].image',
            ]);

            return h('div', { className: 'mj-pv-list-card' }, [
              ImagePreview(props.getAsset, item.image || item, data.title || 'Project gallery image', ''),
              FieldCard('Image Source', unwrapValue(item.image || item)),
            ]);
          }, 'No project gallery images configured')
        ),
        DataAuditPreview(data, tracker, props.getAsset, 'Data Audit Preview'),
        hasSeoFields(data) ? PreviewSection('SEO', SEOPreview(props.getAsset, data, tracker)) : null,
        FieldAuditPreview(data, tracker),
      ]);
    }

    function PublicationsPreview(props) {
      var data = plainData(props.entry);
      var tracker = createFieldTracker();
      tracker.markMany(['title', 'date', 'excerpt', 'cover', 'gallery', 'tags', 'order', 'seoTitle', 'seoDescription', 'body']);

      return PreviewShell([
        PreviewHeader({
          eyebrow: 'Publication Preview',
          title: titleFromData(data, 'Untitled publication'),
          summary: summaryFromData(data, 'Publication card and detail preview.'),
        }),
        PermalinkHint(getEntrySlug(props.entry) ? '/publications/' + getEntrySlug(props.entry) + '/' : '/publications/{slug}/'),
        PreviewSection('Visual Preview',
          h('div', { className: 'mj-pv-visual' }, [
            ImagePreview(props.getAsset, data.cover || firstImageInObject(data.gallery), data.title || 'Publication cover', 'mj-pv-image--hero'),
            PreviewGrid([
              FieldCard('Date', data.date),
              FieldCard('Order', data.order),
              FieldCard('Tags Count', (data.tags || []).length),
              FieldCard('Gallery Count', (data.gallery || []).length),
            ]),
          ])
        ),
        PreviewSection('Inline Gallery',
          ArrayList(data.gallery || [], function (item, index) {
            tracker.markMany([
              'gallery[' + index + ']',
              'gallery[' + index + '].image',
            ]);

            return h('div', { className: 'mj-pv-list-card' }, [
              ImagePreview(props.getAsset, item.image || item, data.title || 'Publication gallery image', ''),
              FieldCard('Image Source', unwrapValue(item.image || item)),
            ]);
          }, 'No inline gallery images configured')
        ),
        DataAuditPreview(data, tracker, props.getAsset, 'Data Audit Preview'),
        hasSeoFields(data) ? PreviewSection('SEO', SEOPreview(props.getAsset, data, tracker)) : null,
        FieldAuditPreview(data, tracker),
      ]);
    }

    function StructuredSettingsPreview(props, label) {
      var data = plainData(props.entry);
      var tracker = createFieldTracker();

      return PreviewShell([
        PreviewHeader({
          eyebrow: label || 'Settings Preview',
          title: titleFromData(data, label || 'Settings entry'),
          summary: summaryFromData(data, 'Structured settings preview.'),
        }),
        PermalinkHint(getEntryPath(props.entry) || '/settings/' + (getEntrySlug(props.entry) || '{slug}') + '/'),
        PreviewSection('Visual Preview',
          h('div', { className: 'mj-pv-visual' }, [
            ImagePreview(props.getAsset, firstImageInObject(data), label || 'Settings image', 'mj-pv-image--hero'),
            PreviewGrid([
              FieldCard('Entry Slug', getEntrySlug(props.entry) || 'Not set'),
              FieldCard('Entry Path', getEntryPath(props.entry) || 'Not set'),
            ]),
          ])
        ),
        DataAuditPreview(data, tracker, props.getAsset, 'Data Audit Preview'),
        FieldAuditPreview(data, tracker),
      ]);
    }

    function SettingsPreview(props) {
      var entry = props.entry;
      var data = plainData(entry);
      var slug = getEntrySlug(entry);
      var path = getEntryPath(entry);

      debugLog('settings-route', {
        collection: getCollectionName(props),
        slug: slug,
        path: path,
        dataKeys: Object.keys(data || {}),
      });

      if (slug === 'site' || (path && path.indexOf('site') !== -1) || data.brand || data.display || data.seo) {
        return SiteSettingsPreview(props);
      }

      if (slug === 'home' || (path && path.indexOf('home') !== -1) || data.hero) {
        return HomePreview(props);
      }

      if (slug === 'navigation' || (path && path.indexOf('navigation') !== -1) || data.main || data.footer) {
        return StructuredSettingsPreview(props, 'Navigation Preview');
      }

      if (slug === 'contact' || (path && path.indexOf('contact') !== -1) || data.form || data.mapEmbedUrl) {
        return StructuredSettingsPreview(props, 'Contact Settings Preview');
      }

      if (slug === 'pages' || (path && path.indexOf('pages') !== -1) || data.portfolio || data.services || data.gallery || data.publications) {
        return StructuredSettingsPreview(props, 'Pages Settings Preview');
      }

      return StructuredSettingsPreview(props, 'Settings Preview');
    }

    function GenericPreview(props) {
      return genericBody(props, {
        component: 'GenericPreview',
        label: 'Collection Preview',
      });
    }

    window.CMS.registerPreviewTemplate('posts', GalleryPreview);
    window.CMS.registerPreviewTemplate('gallery', GalleryPreview);

    window.CMS.registerPreviewTemplate('projects', ProjectsPreview);
    window.CMS.registerPreviewTemplate('services', ServicesPreview);
    window.CMS.registerPreviewTemplate('team', TeamPreview);
    window.CMS.registerPreviewTemplate('publications', PublicationsPreview);

    window.CMS.registerPreviewTemplate('settings', SettingsPreview);
    window.CMS.registerPreviewTemplate('site', SiteSettingsPreview);
    window.CMS.registerPreviewTemplate('home', HomePreview);
    window.CMS.registerPreviewTemplate('navigation', function (props) { return StructuredSettingsPreview(props, 'Navigation Preview'); });
    window.CMS.registerPreviewTemplate('contact', function (props) { return StructuredSettingsPreview(props, 'Contact Settings Preview'); });
    window.CMS.registerPreviewTemplate('pages', function (props) { return StructuredSettingsPreview(props, 'Pages Settings Preview'); });

    window.CMS.registerPreviewTemplate('default', GenericPreview);

    console.log('MJ admin preview system booted');
  }

  bootPreview();
})();
