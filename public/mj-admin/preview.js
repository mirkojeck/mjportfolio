(function () {
  if (!window.CMS) return;

  window.CMS.registerPreviewStyle('/mj-admin/preview.css');

  var h = window.React && window.React.createElement;
  if (!h) return;

  function assetUrl(getAsset, value) {
    if (!value) return '';
    if (value && typeof value.toJS === 'function') value = value.toJS();
    if (value && typeof value === 'object') {
      if (value.url) return value.url;
      if (value.path) return value.path;
      if (value.src) return value.src;
      if (value.image) return assetUrl(getAsset, value.image);
    }
    if (typeof value !== 'string') return '';
    if (value.indexOf('public/') === 0) return value.replace(/^public/, '');
    if (value.indexOf('img/') === 0) return '/' + value;
    if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0 || value.indexOf('/') === 0) return value;
    var asset = getAsset(value);
    if (asset && typeof asset.toJS === 'function') asset = asset.toJS();
    if (asset && asset.url) return asset.url;
    if (asset && asset.path) return asset.path;
    if (asset && asset.src) return asset.src;
    if (asset && asset.toString) {
      var output = asset.toString();
      if (output && output !== '[object Object]') return output;
    }
    return value;
  }

  function imageBlock(getAsset, value, alt, className) {
    var src = assetUrl(getAsset, value);
    return src
      ? h('div', { className: className || 'mj-preview__hero' }, h('img', { src: src, alt: alt || '' }))
      : h('div', { className: 'mj-preview__empty' }, 'No image selected');
  }

  function logoCard(getAsset, label, value, tone) {
    var src = assetUrl(getAsset, value);
    return h('div', { className: 'mj-preview-logo mj-preview-logo--' + tone },
      h('strong', null, label),
      src ? h('img', { src: src, alt: label }) : h('span', null, 'Not set')
    );
  }

  function GalleryPreview(props) {
    var entry = props.entry;
    var getAsset = props.getAsset;
    var data = entry.get('data').toJS();
    var gallery = data.gallery || [];
    var cover = data.cover;
    var tags = data.tags || [];

    return h('article', { className: 'mj-preview' },
      h('p', { className: 'mj-preview__eyebrow' }, 'Gallery / Case Study Preview'),
      h('h1', { className: 'mj-preview__title' }, data.title || 'Untitled gallery'),
      h('p', { className: 'mj-preview__summary' }, data.excerpt || 'Add a short visual summary for this gallery.'),
      imageBlock(getAsset, cover, data.title || '', 'mj-preview__hero'),
      h('div', { className: 'mj-preview__meta' },
        h('span', null, 'Layout: ' + (data.galleryLayout || 'slider')),
        h('span', null, 'Hover: ' + (data.hoverEffect || 'zoom')),
        h('span', null, 'Images: ' + gallery.length),
        h('span', null, 'Tags: ' + (tags.join(', ') || 'none'))
      ),
      h('div', { className: 'mj-preview__thumbs' },
        gallery.map(function (image, index) {
          var src = assetUrl(getAsset, image);
          return src
            ? h('div', { className: 'mj-preview__thumb', key: image + index },
              h('img', { src: src, alt: (data.title || 'Gallery image') + ' ' + (index + 1) })
            )
            : h('div', { className: 'mj-preview__empty', key: 'empty' + index }, 'Image not available');
        })
      )
    );
  }

  function HomePreview(props) {
    var data = props.entry.get('data').toJS();
    var hero = data.hero || {};
    var about = data.about || {};
    var blogPreview = data.blogPreview || {};

    return h('article', { className: 'mj-preview' },
      h('p', { className: 'mj-preview__eyebrow' }, 'Home Page Preview'),
      h('h1', { className: 'mj-preview__title' }, [hero.titlePart1, hero.titleThin1, hero.titlePart2, hero.titleThin2].filter(Boolean).join(' ')),
      h('p', { className: 'mj-preview__summary' }, hero.description || ''),
      imageBlock(props.getAsset, about.image, 'Home preview', 'mj-preview__hero'),
      h('div', { className: 'mj-preview-note' },
        h('strong', null, blogPreview.heading || 'Gallery section'),
        h('p', null, blogPreview.description || 'This home section is populated from Gallery / Case Studies content.')
      )
    );
  }

  function SiteSettingsPreview(props) {
    var data = props.entry.get('data').toJS();
    var getAsset = props.getAsset;

    if (data.hero) return HomePreview(props);

    if (!data.brand) {
      return h('article', { className: 'mj-preview' },
        h('p', { className: 'mj-preview__eyebrow' }, 'Settings Preview'),
        h('h1', { className: 'mj-preview__title' }, 'Editable settings'),
        h('p', { className: 'mj-preview__summary' }, 'This file controls structured content used by the site.')
      );
    }

    var brand = data.brand || {};
    var logo = brand.logo || {};
    var images = logo.images || {};
    var display = logo.display || {};
    var seo = data.seo || {};

    return h('article', { className: 'mj-preview' },
      h('p', { className: 'mj-preview__eyebrow' }, 'Site Settings Preview'),
      h('h1', { className: 'mj-preview__title' }, brand.name || 'Site name'),
      h('p', { className: 'mj-preview__summary' }, seo.description || 'Default SEO description will appear here.'),
      h('div', { className: 'mj-preview-logo-grid' },
        logoCard(getAsset, 'Light logo - dark hero/menu/footer', images.light || brand.logoLight || images.fallback || brand.logoImage, 'dark'),
        logoCard(getAsset, 'Dark logo - light sections', images.dark || brand.logoDark || images.fallback || brand.logoImage, 'light')
      ),
      h('div', { className: 'mj-preview__meta' },
        h('span', null, 'Recommended logo: transparent PNG/WebP/SVG'),
        h('span', null, 'Suggested size: around 600x200px'),
        h('span', null, 'Height: ' + (display.height || brand.logoHeight || 44) + 'px'),
        h('span', null, 'Zoom: ' + (display.scale || brand.logoScale || 1))
      ),
      h('div', { className: 'mj-preview-note' },
        h('strong', null, 'Logo guide'),
        h('p', null, 'Use a light or white logo for dark hero/menu/footer. Use a dark logo for white sections after scroll. Leave Footer Logo empty unless it needs a special version.')
      )
    );
  }

  window.CMS.registerPreviewTemplate('posts', GalleryPreview);
  window.CMS.registerPreviewTemplate('home', HomePreview);
  window.CMS.registerPreviewTemplate('settings', SiteSettingsPreview);
})();
