const hostname = 'greenforest-pulawy.pl';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const production = [hostname, 'www.' + hostname].includes(url.hostname);
    const response = await env.ASSETS.fetch(request);
    // Static Assets uses temporary redirects for /page and /page/index.html.
    // These URLs have permanent canonical destinations on this static site.
    const location = response.headers.get('Location');
    const target = location ? new URL(location, url) : new URL(url);
    const localRedirect = location && target.origin === url.origin;
    if (production && (url.protocol !== 'https:' || url.hostname !== hostname)) {
      if (!localRedirect) target.href = url.href;
      target.protocol = 'https:';
      target.hostname = hostname;
      target.port = '';
      if (!target.search) target.search = url.search;
      return Response.redirect(target.href, ['GET', 'HEAD'].includes(request.method) ? 301 : 308);
    }
    if (localRedirect && [302, 307].includes(response.status) && ['GET', 'HEAD'].includes(request.method)) {
      if (!target.search) target.search = url.search;
      return Response.redirect(target.href, 301);
    }
    return response;
  }
};
